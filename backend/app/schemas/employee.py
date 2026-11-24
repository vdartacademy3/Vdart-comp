from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.user import EmployeeRole

class EmployeeResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    role: EmployeeRole
    department: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[EmployeeRole] = None
    is_active: Optional[bool] = None
