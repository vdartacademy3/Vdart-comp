from pydantic import BaseModel
from typing import Optional, List
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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanionProfileUpdate(BaseModel):
    companion_name: Optional[str] = None
    personality_tone: Optional[str] = None
    active_language: Optional[str] = None
    selected_voice: Optional[str] = None
    speech_rate: Optional[float] = None
    speech_pitch: Optional[float] = None
    auto_speak: Optional[bool] = None
    robot_size: Optional[str] = None
    system_prompt: Optional[str] = None

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
