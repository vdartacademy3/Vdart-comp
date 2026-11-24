import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee, AuditLog
from ..auth.dependencies import get_current_employee, require_admin
from ..config import settings

router = APIRouter(prefix="/system", tags=["System & Diagnostics"])

QUESTIONS_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "questions_db.json"

@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    """Healthcheck endpoint for Desktop and Web applications."""
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "groq_model": settings.GROQ_MODEL,
        "whisper_model": settings.GROQ_WHISPER_MODEL,
        "multilingual_sentiment_engine": "online",
        "supported_languages": ["ta", "en", "tanglish"]
    }

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    current_employee: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to inspect security and data access audit events."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "employee_id": l.employee_id,
            "action": l.action,
            "resource": l.resource,
            "ip_address": l.ip_address,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

@router.get("/questions")
def get_question_bank(
    category: str = None,
    limit: int = 50,
    current_employee: Employee = Depends(get_current_employee)
):
    """Serves employee psychology questions from the 2000-question repository."""
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
