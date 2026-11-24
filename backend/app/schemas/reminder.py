from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_time: datetime

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_time: Optional[datetime] = None
    status: Optional[str] = None
    snooze_minutes: Optional[int] = None

class ReminderResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    description: Optional[str]
    due_time: datetime
    status: str
    snooze_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
