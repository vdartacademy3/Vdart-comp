from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base

class CompanionProfile(Base):
    __tablename__ = "companion_profiles"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    companion_name = Column(String(100), default="VCamp")
    personality_tone = Column(String(50), default="supportive")
    active_language = Column(String(20), default="auto")  # auto, ta, en, tanglish
    selected_voice = Column(String(100), default="Microsoft Heera - English (India)")
    speech_rate = Column(Float, default=1.0)
    speech_pitch = Column(Float, default=1.0)
    auto_speak = Column(Boolean, default=True)
    robot_size = Column(String(20), default="medium")  # small, medium, large
    system_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="companion_profile")

class CompanionModelAsset(Base):
    __tablename__ = "companion_models"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(150), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    model_format = Column(String(20), default="glb")  # glb, gltf
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="companion_models")
