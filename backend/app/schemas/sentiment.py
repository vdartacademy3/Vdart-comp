from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class SentimentAnalyzeRequest(BaseModel):
    text: str
    language_hint: Optional[str] = "auto"
    include_context: Optional[bool] = True

class SentimentAnalyzeResponse(BaseModel):
    primary_emotion: str
    secondary_emotion: Optional[str] = None
    confidence: float
    per_class_scores: Dict[str, float]
    detected_language: str
    polarity: str
    model_version: str
    prediction_timestamp: datetime
    is_uncertain: bool

class SentimentHistoryItem(BaseModel):
    id: int
    employee_id: int
    message_text: str
    primary_emotion: str
    secondary_emotion: Optional[str]
    confidence: float
    detected_language: str
    polarity: str
    is_uncertain: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SentimentAnalyticsSummary(BaseModel):
    total_analyzed: int
    dominant_emotion: str
    emotion_distribution: Dict[str, int]
    language_distribution: Dict[str, int]
    average_confidence: float
    uncertainty_rate: float
