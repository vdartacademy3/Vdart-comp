from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CompanionProfileResponse(BaseModel):
    id: int
    employee_id: int
    companion_name: str
    personality_tone: str
    active_language: str
    selected_voice: str
    speech_rate: float
    speech_pitch: float
    auto_speak: bool
    robot_size: str
    system_prompt: Optional[str] = None
    selected_character_id: str = "vcamp_robot"
    character_settings_json: Optional[str] = None
    ai_provider: str = "groq"
    ai_model: str = "llama-3.3-70b-versatile"
    consent_sentiment: bool = True
    consent_memory: bool = True
    consent_questions: bool = True
    retention_days: int = 90
    quiet_hours_enabled: bool = True
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    consent_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompanionProfileUpdate(BaseModel):
    companion_name: Optional[str] = None
    personality_tone: Optional[str] = None
    active_language: Optional[str] = None
    selected_voice: Optional[str] = None
    speech_rate: Optional[float] = Field(default=None, ge=0.5, le=2.0)
    speech_pitch: Optional[float] = Field(default=None, ge=0.5, le=2.0)
    auto_speak: Optional[bool] = None
    robot_size: Optional[str] = None
    system_prompt: Optional[str] = None
    selected_character_id: Optional[str] = None
    character_settings_json: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    consent_sentiment: Optional[bool] = None
    consent_memory: Optional[bool] = None
    consent_questions: Optional[bool] = None
    retention_days: Optional[int] = Field(default=None, ge=1, le=3650)
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class CompanionModelAssetResponse(BaseModel):
    id: int
    employee_id: int
    model_name: str
    file_path: str
    file_size_bytes: int
    model_format: str
    is_active: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True
