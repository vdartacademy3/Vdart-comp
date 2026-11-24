import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base

class EmployeeRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(EmployeeRole), default=EmployeeRole.EMPLOYEE, nullable=False)
    department = Column(String(100), default="Engineering")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("EmployeeSession", back_populates="employee", cascade="all, delete-orphan")
    companion_profile = relationship("CompanionProfile", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    companion_models = relationship("CompanionModelAsset", back_populates="employee", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="employee", cascade="all, delete-orphan")
    sentiment_predictions = relationship("SentimentPrediction", back_populates="employee", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="employee", cascade="all, delete-orphan")
    memories = relationship("UserMemory", back_populates="employee", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="employee")

class EmployeeSession(Base):
    __tablename__ = "employee_sessions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, index=True, nullable=False)
    device_info = Column(String(255), default="Windows Desktop Companion")
    is_revoked = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    ip_address = Column(String(45), default="127.0.0.1")
    details = Column(Text, nullable=True)  # JSON formatted metadata
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    employee = relationship("Employee", back_populates="audit_logs")
