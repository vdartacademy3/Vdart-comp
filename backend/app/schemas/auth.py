from pydantic import BaseModel, EmailStr
from typing import Optional
from ..models.user import EmployeeRole

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    role: Optional[EmployeeRole] = EmployeeRole.EMPLOYEE
    department: Optional[str] = "Engineering"

class LoginRequest(BaseModel):
    login: str  # Email or username
    password: str

class PasswordResetRequest(BaseModel):
    current_password: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee_id: int
    email: str
    username: str
    full_name: str
    role: EmployeeRole
    department: str
