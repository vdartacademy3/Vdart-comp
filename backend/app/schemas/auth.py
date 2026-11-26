from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from ..models.user import EmployeeRole


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=100)
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    department: Optional[str] = "Engineering"


class AdminCreateEmployeeRequest(RegisterRequest):
    role: Optional[EmployeeRole] = EmployeeRole.EMPLOYEE


class LoginRequest(BaseModel):
    login: str
    password: str


class PasswordResetRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee_id: int
    email: str
    username: str
    full_name: str
    role: EmployeeRole
    department: str
