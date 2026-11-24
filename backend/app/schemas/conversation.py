from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MessageCreate(BaseModel):
    text: str
    language: Optional[str] = "auto"

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    employee_id: int
    sender: str
    text: str
    language: str
    sentiment_emotion: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    language: Optional[str] = "auto"

class ChatResponse(BaseModel):
    conversation_id: int
    user_message: MessageResponse
    companion_message: MessageResponse
    detected_emotion: str
    confidence: float
    is_uncertain: bool

class UserMemoryCreate(BaseModel):
    memory_key: str
    memory_value: str
    category: Optional[str] = "preference"

class UserMemoryResponse(BaseModel):
    id: int
    employee_id: int
    memory_key: str
    memory_value: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True
