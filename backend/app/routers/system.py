import json
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee, AuditLog
from ..models.conversation import Conversation, Message, UserMemory
from ..models.sentiment import SentimentPrediction, QuestionInteraction
from ..models.reminder import Reminder
from ..auth.dependencies import get_current_employee, require_admin
from ..config import settings

router = APIRouter(prefix="/system", tags=["System & Diagnostics"])

QUESTIONS_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "questions_db.json"


@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "ai_provider": settings.AI_PROVIDER,
        "groq_model": settings.GROQ_MODEL,
        "whisper_model": settings.GROQ_WHISPER_MODEL,
        "multilingual_sentiment_engine": "online",
        "supported_languages": ["ta", "en", "tanglish"],
    }


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    current_employee: Employee = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "employee_id": l.employee_id,
            "action": l.action,
            "resource": l.resource,
            "ip_address": l.ip_address,
            "details": l.details,
            "timestamp": l.timestamp,
        }
        for l in logs
    ]


@router.get("/privacy-export")
def export_personal_data(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Exports only the authenticated employee's own isolated data."""
    convs = db.query(Conversation).filter(Conversation.employee_id == current_employee.id).all()
    memories = db.query(UserMemory).filter(UserMemory.employee_id == current_employee.id).all()
    sentiments = (
        db.query(SentimentPrediction)
        .filter(SentimentPrediction.employee_id == current_employee.id, SentimentPrediction.is_deleted == False)
        .all()
    )
    reminders = db.query(Reminder).filter(Reminder.employee_id == current_employee.id).all()
    questions = db.query(QuestionInteraction).filter(QuestionInteraction.employee_id == current_employee.id).all()

    return {
        "exported_at": datetime.utcnow().isoformat(),
        "employee": {
            "id": current_employee.id,
            "email": current_employee.email,
            "username": current_employee.username,
            "full_name": current_employee.full_name,
            "department": current_employee.department,
        },
        "conversations": [
            {
                "id": c.id,
                "title": c.title,
                "messages": [{"sender": m.sender, "text": m.text, "created_at": m.created_at.isoformat()} for m in c.messages],
            }
            for c in convs
        ],
        "memories": [{"key": m.memory_key, "value": m.memory_value, "category": m.category} for m in memories],
        "sentiment_records": [
            {
                "emotion": s.primary_emotion,
                "confidence": s.confidence,
                "context_category": s.context_category,
                "created_at": s.created_at.isoformat(),
            }
            for s in sentiments
        ],
        "reminders": [{"title": r.title, "status": r.status, "due_time": r.due_time.isoformat()} for r in reminders],
        "question_interactions": [
            {"question": q.question_text, "status": q.status, "created_at": q.created_at.isoformat()}
            for q in questions
        ],
    }


@router.post("/backup")
def create_database_backup(
    current_employee: Employee = Depends(require_admin),
):
    """Creates a local SQLite database backup in the configured backup directory."""
    db_path = settings.DATA_DIR / "vcamp_enterprise.db"
    if not db_path.exists():
        raise HTTPException(status_code=404, detail="SQLite database file not found")
    stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dest = settings.BACKUP_DIR / f"vcamp_backup_{stamp}.db"
    shutil.copy2(db_path, dest)
    return {"backup_file": dest.name, "created_at": stamp}


@router.get("/questions")
def get_question_bank(
    category: str = None,
    limit: int = 50,
    current_employee: Employee = Depends(get_current_employee),
):
    if not QUESTIONS_FILE.exists():
        return {"questions": []}
    try:
        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            questions = data if isinstance(data, list) else data.get("questions", [])
            if category:
                questions = [q for q in questions if q.get("category") == category]
            return {"total": len(questions), "questions": questions[:limit]}
    except Exception:
        return {"questions": []}
