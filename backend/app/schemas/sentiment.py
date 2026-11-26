from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime


class SentimentAnalyzeRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    language_hint: Optional[str] = "auto"
    include_context: Optional[bool] = True


class SentimentAnalyzeResponse(BaseModel):
    id: Optional[int] = None
    primary_emotion: str
    secondary_emotion: Optional[str] = None
    confidence: float
    per_class_scores: Dict[str, float]
    detected_language: str
    polarity: str
    context_category: str = "general"
    model_version: str
    prediction_timestamp: datetime
    is_uncertain: bool


class SentimentHistoryItem(BaseModel):
    id: int
    employee_id: int
    session_id: Optional[str] = None
    message_text: str
    primary_emotion: str
    secondary_emotion: Optional[str] = None
    confidence: float
    detected_language: str
    polarity: str
    context_category: str = "general"
    user_feedback: Optional[str] = None
    is_uncertain: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SentimentFeedbackRequest(BaseModel):
    corrected_emotion: str


class DepartmentAggregateItem(BaseModel):
    department: str
    employee_count: int
    record_count: int
    suppressed_for_privacy: bool
    dominant_emotion: Optional[str] = None
    workload_concern_rate: Optional[float] = None
    positive_rate: Optional[float] = None


class SentimentAnalyticsSummary(BaseModel):
    total_analyzed: int
    dominant_emotion: str
    emotion_distribution: Dict[str, int]
    language_distribution: Dict[str, int]
    context_distribution: Dict[str, int] = {}
    average_confidence: float
    uncertainty_rate: float
    department_aggregates: List[DepartmentAggregateItem] = []
    privacy_note: str = ""
