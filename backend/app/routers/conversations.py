from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee
from ..models.conversation import Conversation, Message, UserMemory
from ..models.sentiment import SentimentPrediction
from ..schemas.conversation import (
    ConversationResponse, 
    MessageResponse, 
    ChatRequest, 
    ChatResponse,
    UserMemoryCreate,
    UserMemoryResponse
)
from ..auth.dependencies import get_current_employee
from ..services.groq_service import groq_service
from ..services.sentiment_service import sentiment_classifier
import json

router = APIRouter(prefix="/conversations", tags=["Conversations & AI Chat"])

@router.get("", response_model=List[ConversationResponse])
def get_conversations(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Retrieve all conversations strictly owned by the authenticated employee."""
    return db.query(Conversation).filter(
        Conversation.employee_id == current_employee.id
    ).order_by(Conversation.updated_at.desc()).all()

@router.post("", response_model=ConversationResponse)
def create_conversation(
    title: str = "Desktop Session",
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Create a new isolated conversation thread for this employee."""
    conv = Conversation(
        employee_id=current_employee.id,
        title=title
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Retrieve a specific conversation, strictly ensuring employee ownership."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.employee_id == current_employee.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied"
        )
    return conv

@router.post("/chat", response_model=ChatResponse)
async def chat_with_companion(
    request: ChatRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    End-to-end isolated chat flow:
    1. Retrieve or create employee conversation
    2. Sentiment classify user text (15 emotions, Tamil/Tanglish/English)
    3. Save sentiment prediction
    4. Inject employee memories
    5. Call Groq AI completion
    6. Return unified response
    """
    # 1. Get or create active conversation for this employee
    conv_id = request.conversation_id
    if conv_id:
        conv = db.query(Conversation).filter(
            Conversation.id == conv_id,
            Conversation.employee_id == current_employee.id
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")
    else:
        conv = Conversation(employee_id=current_employee.id, title="Desktop Chat")
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Run dedicated sentiment analysis
    sentiment_res = sentiment_classifier.classify(request.message)

    # 3. Store sentiment prediction in database
    prediction = SentimentPrediction(
        employee_id=current_employee.id,
        message_text=request.message,
        primary_emotion=sentiment_res["primary_emotion"],
        secondary_emotion=sentiment_res["secondary_emotion"],
        confidence=sentiment_res["confidence"],
        detected_language=sentiment_res["detected_language"],
        polarity=sentiment_res["polarity"],
        per_class_scores=json.dumps(sentiment_res["per_class_scores"]),
        is_uncertain=sentiment_res["is_uncertain"]
    )
    db.add(prediction)

    # 4. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        employee_id=current_employee.id,
        sender="user",
        text=request.message,
        language=sentiment_res["detected_language"],
        sentiment_emotion=sentiment_res["primary_emotion"],
        sentiment_confidence=sentiment_res["confidence"]
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 5. Fetch prior messages and employee memories
    prior_messages = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.employee_id == current_employee.id
    ).order_by(Message.created_at.asc()).all()

    conv_history = [{"role": ("user" if m.sender == "user" else "assistant"), "content": m.text} for m in prior_messages]

    memories_rows = db.query(UserMemory).filter(UserMemory.employee_id == current_employee.id).all()
    memories_list = [{"key": m.memory_key, "value": m.memory_value} for m in memories_rows]

    # Custom prompt from companion profile if any
    profile = current_employee.companion_profile
    custom_prompt = profile.system_prompt if profile else None

    # 6. Generate Groq AI response
    ai_result = await groq_service.generate_response(
        user_message=request.message,
        conversation_history=conv_history,
        employee_memories=memories_list,
        custom_system_prompt=custom_prompt
    )

    # 7. Save companion response message
    companion_msg = Message(
        conversation_id=conv.id,
        employee_id=current_employee.id,
        sender="companion",
        text=ai_result["reply"],
        language=ai_result["detected_language"],
        sentiment_emotion=sentiment_res["primary_emotion"],
        sentiment_confidence=sentiment_res["confidence"]
    )
    db.add(companion_msg)
    db.commit()
    db.refresh(companion_msg)

    return ChatResponse(
        conversation_id=conv.id,
        user_message=user_msg,
        companion_message=companion_msg,
        detected_emotion=sentiment_res["primary_emotion"],
        confidence=sentiment_res["confidence"],
        is_uncertain=sentiment_res["is_uncertain"]
    )

# --- Employee Memory Endpoints ---
@router.get("/memories/list", response_model=List[UserMemoryResponse])
def get_employee_memories(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Retrieve all isolated memories for the current employee."""
    return db.query(UserMemory).filter(UserMemory.employee_id == current_employee.id).all()

@router.post("/memories/add", response_model=UserMemoryResponse)
def add_employee_memory(
    memory_in: UserMemoryCreate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Store a personal contextual fact or preference for this employee's companion."""
    existing = db.query(UserMemory).filter(
        UserMemory.employee_id == current_employee.id,
        UserMemory.memory_key == memory_in.memory_key
    ).first()

    if existing:
        existing.memory_value = memory_in.memory_value
        existing.category = memory_in.category or existing.category
        db.commit()
        db.refresh(existing)
        return existing

    new_mem = UserMemory(
        employee_id=current_employee.id,
        memory_key=memory_in.memory_key,
        memory_value=memory_in.memory_value,
        category=memory_in.category or "preference"
    )
    db.add(new_mem)
    db.commit()
    db.refresh(new_mem)
    return new_mem
