from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class SentimentPrediction(Base):
    __tablename__ = "sentiment_predictions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=True, index=True)
    message_text = Column(Text, nullable=False)
    primary_emotion = Column(String(50), nullable=False, index=True)
    secondary_emotion = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=False)
    detected_language = Column(String(20), nullable=False)  # ta, en, tanglish
    polarity = Column(String(20), nullable=False)  # positive, negative, neutral
    context_category = Column(String(50), default="general")  # general, workload, stress, motivation, positive, frustration
    per_class_scores = Column(Text, nullable=False)  # JSON string
    is_uncertain = Column(Boolean, default=False)
    user_feedback = Column(String(100), nullable=True)  # user-corrected label or feedback note
    is_deleted = Column(Boolean, default=False, index=True)
    model_version = Column(String(50), default="vcamp-multilingual-v3.0")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    employee = relationship("Employee", back_populates="sentiment_predictions")


class QuestionInteraction(Base):
    __tablename__ = "question_interactions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    question_key = Column(String(100), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    trigger_context = Column(String(50), default="general")  # workload, motivation, frustration, positive, checkin
    status = Column(String(20), nullable=False, default="asked")  # asked, answered, skipped, snoozed
    answer_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ModelEvaluationRecord(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False, index=True)
    dataset_name = Column(String(100), nullable=False)
    sample_count = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    weighted_f1 = Column(Float, nullable=False)
    language_breakdown = Column(Text, nullable=False)  # JSON
    per_class_metrics = Column(Text, nullable=False)  # JSON
    confusion_matrix = Column(Text, nullable=False)  # JSON
    evaluated_at = Column(DateTime, default=datetime.utcnow, index=True)
