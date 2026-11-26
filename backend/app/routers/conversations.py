import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee
from ..models.conversation import Conversation, Message, UserMemory
from ..models.sentiment import SentimentPrediction
from ..schemas.conversation import (
    ConversationResponse,
    ChatRequest,
    ChatResponse,
    UserMemoryCreate,
    UserMemoryResponse,
)
from ..auth.dependencies import get_current_employee
from ..services.companion_service import companion_service
from ..services.groq_service import ai_provider_service
from ..services.sentiment_service import sentiment_classifier
from ..services.question_service import question_service

router = APIRouter(prefix="/conversations", tags=["Conversations & AI Chat"])


@router.get("", response_model=List[ConversationResponse])
def get_conversations(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversation)
        .filter(Conversation.employee_id == current_employee.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@router.post("", response_model=ConversationResponse)
def create_conversation(
    title: str = "Desktop Session",
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    conv = Conversation(employee_id=current_employee.id, title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.employee_id == current_employee.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied",
        )
    return conv


@router.post("/chat", response_model=ChatResponse)
async def chat_with_companion(
    request: ChatRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)

    conv_id = request.conversation_id
    if conv_id:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == conv_id,
                Conversation.employee_id == current_employee.id,
            )
            .first()
        )
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")
    else:
        conv = Conversation(employee_id=current_employee.id, title="Desktop Chat")
        db.add(conv)
        db.commit()
        db.refresh(conv)

    last_pred = (
        db.query(SentimentPrediction)
        .filter(
            SentimentPrediction.employee_id == current_employee.id,
            SentimentPrediction.is_deleted == False,
        )
        .order_by(SentimentPrediction.created_at.desc())
        .first()
    )
    context_emotion = last_pred.primary_emotion if last_pred else None

    if profile.consent_sentiment:
        sentiment_res = sentiment_classifier.classify(request.message, context_emotion=context_emotion)
        db.add(
            SentimentPrediction(
                employee_id=current_employee.id,
                session_id=request.session_id or f"conv_{conv.id}",
                message_text=request.message,
                primary_emotion=sentiment_res["primary_emotion"],
                secondary_emotion=sentiment_res["secondary_emotion"],
                confidence=sentiment_res["confidence"],
                detected_language=sentiment_res["detected_language"],
                polarity=sentiment_res["polarity"],
                context_category=sentiment_res.get("context_category", "general"),
                per_class_scores=json.dumps(sentiment_res["per_class_scores"]),
                is_uncertain=sentiment_res["is_uncertain"],
            )
        )
    else:
        sentiment_res = {
            "primary_emotion": "neutral",
            "confidence": 1.0,
            "detected_language": sentiment_classifier.detect_language(request.message),
            "context_category": "general",
            "is_uncertain": False,
        }

    user_msg = Message(
        conversation_id=conv.id,
        employee_id=current_employee.id,
        sender="user",
        text=request.message,
        language=sentiment_res["detected_language"],
        sentiment_emotion=sentiment_res["primary_emotion"] if profile.consent_sentiment else None,
        sentiment_confidence=sentiment_res["confidence"] if profile.consent_sentiment else None,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    prior_messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.employee_id == current_employee.id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    conv_history = [
        {"role": ("user" if m.sender == "user" else "assistant"), "content": m.text}
        for m in prior_messages[:-1]
    ]

    memories_list = []
    if profile.consent_memory:
        memories_rows = db.query(UserMemory).filter(UserMemory.employee_id == current_employee.id).all()
        memories_list = [{"key": m.memory_key, "value": m.memory_value} for m in memories_rows]

    ai_result = await ai_provider_service.generate_response(
        user_message=request.message,
        conversation_history=conv_history,
        employee_memories=memories_list,
        custom_system_prompt=profile.system_prompt,
        provider=request.ai_provider or profile.ai_provider,
        model=request.ai_model or profile.ai_model,
        api_key=request.api_key,
        context_emotion=context_emotion,
    )

    companion_msg = Message(
        conversation_id=conv.id,
        employee_id=current_employee.id,
        sender="companion",
        text=ai_result["reply"],
        language=ai_result["detected_language"],
        sentiment_emotion=sentiment_res["primary_emotion"] if profile.consent_sentiment else None,
        sentiment_confidence=sentiment_res["confidence"] if profile.consent_sentiment else None,
    )
    db.add(companion_msg)
    db.commit()
    db.refresh(companion_msg)

    suggested_q = question_service.get_contextual_suggestion(db, current_employee.id, profile)

    return ChatResponse(
        conversation_id=conv.id,
        user_message=user_msg,
        companion_message=companion_msg,
        detected_emotion=sentiment_res["primary_emotion"],
        confidence=sentiment_res["confidence"],
        is_uncertain=sentiment_res["is_uncertain"],
        context_category=sentiment_res.get("context_category", "general"),
        suggested_question=suggested_q,
    )


@router.get("/memories/list", response_model=List[UserMemoryResponse])
def get_employee_memories(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return db.query(UserMemory).filter(UserMemory.employee_id == current_employee.id).all()


@router.post("/memories/add", response_model=UserMemoryResponse)
def add_employee_memory(
    memory_in: UserMemoryCreate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)
    if not profile.consent_memory:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Personal memory storage is disabled by your privacy consent settings",
        )

    existing = (
        db.query(UserMemory)
        .filter(
            UserMemory.employee_id == current_employee.id,
            UserMemory.memory_key == memory_in.memory_key,
        )
        .first()
    )

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
        category=memory_in.category or "preference",
    )
    db.add(new_mem)
    db.commit()
    db.refresh(new_mem)
    return new_mem


@router.delete("/memories/{memory_id}")
def delete_employee_memory(
    memory_id: int,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    mem = (
        db.query(UserMemory)
        .filter(
            UserMemory.id == memory_id,
            UserMemory.employee_id == current_employee.id,
        )
        .first()
    )
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(mem)
    db.commit()
    return {"message": "Memory deleted"}
