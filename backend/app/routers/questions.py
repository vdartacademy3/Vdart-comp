from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee
from ..models.sentiment import QuestionInteraction
from ..auth.dependencies import get_current_employee
from ..services.companion_service import companion_service
from ..services.question_service import question_service

router = APIRouter(prefix="/questions", tags=["Intelligent Question Engine"])


class QuestionRespondRequest(BaseModel):
    question_key: str
    question_text: str
    trigger_context: str = "general"
    status: str = "answered"  # answered | skipped | snoozed
    answer_text: Optional[str] = None


@router.get("/next")
def get_next_contextual_question(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)
    suggestion = question_service.get_contextual_suggestion(db, current_employee.id, profile)
    return {
        "consent_enabled": bool(profile.consent_questions),
        "quiet_hours_active": question_service.is_quiet_hours(profile),
        "suggestion": suggestion,
    }


@router.post("/respond")
def record_question_response(
    payload: QuestionRespondRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)
    stored_answer = payload.answer_text if profile.consent_questions else None

    row = QuestionInteraction(
        employee_id=current_employee.id,
        question_key=payload.question_key,
        question_text=payload.question_text,
        trigger_context=payload.trigger_context,
        status=payload.status,
        answer_text=stored_answer,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "status": row.status, "consent_stored": bool(profile.consent_questions)}


@router.get("/history")
def get_question_history(
    limit: int = 30,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(QuestionInteraction)
        .filter(QuestionInteraction.employee_id == current_employee.id)
        .order_by(QuestionInteraction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "question_key": r.question_key,
            "question_text": r.question_text,
            "trigger_context": r.trigger_context,
            "status": r.status,
            "answer_text": r.answer_text,
            "created_at": r.created_at,
        }
        for r in rows
    ]
