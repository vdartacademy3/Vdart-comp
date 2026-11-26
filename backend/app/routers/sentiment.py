import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models.user import Employee, EmployeeRole
from ..models.sentiment import SentimentPrediction
from ..schemas.sentiment import (
    SentimentAnalyzeRequest,
    SentimentAnalyzeResponse,
    SentimentHistoryItem,
    SentimentFeedbackRequest,
    SentimentAnalyticsSummary,
    DepartmentAggregateItem,
)
from ..auth.dependencies import get_current_employee
from ..services.companion_service import companion_service
from ..services.sentiment_service import sentiment_classifier, EMOTIONS

router = APIRouter(prefix="/sentiment", tags=["Sentiment Intelligence"])


@router.post("/analyze", response_model=SentimentAnalyzeResponse)
def analyze_text(
    request: SentimentAnalyzeRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)

    context_emotion = None
    if request.include_context:
        last = (
            db.query(SentimentPrediction)
            .filter(
                SentimentPrediction.employee_id == current_employee.id,
                SentimentPrediction.is_deleted == False,
            )
            .order_by(SentimentPrediction.created_at.desc())
            .first()
        )
        if last:
            context_emotion = last.primary_emotion

    res = sentiment_classifier.classify(request.text, context_emotion=context_emotion)

    pred_id = None
    if profile.consent_sentiment:
        prediction = SentimentPrediction(
            employee_id=current_employee.id,
            session_id=request.session_id,
            message_text=request.text,
            primary_emotion=res["primary_emotion"],
            secondary_emotion=res["secondary_emotion"],
            confidence=res["confidence"],
            detected_language=res["detected_language"],
            polarity=res["polarity"],
            context_category=res.get("context_category", "general"),
            per_class_scores=json.dumps(res["per_class_scores"]),
            is_uncertain=res["is_uncertain"],
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        pred_id = prediction.id

    return SentimentAnalyzeResponse(
        id=pred_id,
        primary_emotion=res["primary_emotion"],
        secondary_emotion=res["secondary_emotion"],
        confidence=res["confidence"],
        per_class_scores=res["per_class_scores"],
        detected_language=res["detected_language"],
        polarity=res["polarity"],
        context_category=res.get("context_category", "general"),
        model_version=res["model_version"],
        prediction_timestamp=res["prediction_timestamp"],
        is_uncertain=res["is_uncertain"],
    )


@router.get("/history", response_model=List[SentimentHistoryItem])
def get_sentiment_history(
    limit: int = Query(50, ge=1, le=200),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)
    cutoff = datetime.utcnow() - timedelta(days=max(1, profile.retention_days or 90))
    return (
        db.query(SentimentPrediction)
        .filter(
            SentimentPrediction.employee_id == current_employee.id,
            SentimentPrediction.is_deleted == False,
            SentimentPrediction.created_at >= cutoff,
        )
        .order_by(SentimentPrediction.created_at.desc())
        .limit(limit)
        .all()
    )


@router.put("/{prediction_id}/feedback", response_model=SentimentHistoryItem)
def submit_sentiment_feedback(
    prediction_id: int,
    payload: SentimentFeedbackRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    if payload.corrected_emotion not in EMOTIONS:
        raise HTTPException(status_code=400, detail="Invalid emotion category")

    row = (
        db.query(SentimentPrediction)
        .filter(
            SentimentPrediction.id == prediction_id,
            SentimentPrediction.employee_id == current_employee.id,
            SentimentPrediction.is_deleted == False,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Sentiment record not found")

    row.user_feedback = payload.corrected_emotion
    row.primary_emotion = payload.corrected_emotion
    db.commit()
    db.refresh(row)
    return row


@router.delete("/history")
def delete_my_sentiment_history(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Allows an employee to delete their own sentiment history at any time."""
    deleted = (
        db.query(SentimentPrediction)
        .filter(SentimentPrediction.employee_id == current_employee.id)
        .delete()
    )
    db.commit()
    return {"deleted_records": deleted, "message": "Your personal sentiment history has been deleted."}


@router.get("/analytics", response_model=SentimentAnalyticsSummary)
def get_sentiment_analytics(
    scope: str = Query("personal", pattern="^(personal|organization)$"),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """
    Privacy-preserving analytics:
    - Personal scope: strictly own non-deleted records.
    - Organization scope (Admin/Super Admin only): aggregated workplace & department trends
      with k-anonymity threshold suppression and zero private transcript exposure.
    """
    is_org_allowed = current_employee.role in [EmployeeRole.ADMIN, EmployeeRole.SUPER_ADMIN]
    effective_scope = "organization" if (scope == "organization" and is_org_allowed) else "personal"

    base_query = db.query(SentimentPrediction).filter(SentimentPrediction.is_deleted == False)
    if effective_scope == "personal":
        base_query = base_query.filter(SentimentPrediction.employee_id == current_employee.id)

    records = base_query.all()
    if not records:
        return SentimentAnalyticsSummary(
            total_analyzed=0,
            dominant_emotion="neutral",
            emotion_distribution={},
            language_distribution={},
            context_distribution={},
            average_confidence=0.0,
            uncertainty_rate=0.0,
            department_aggregates=[],
            privacy_note="No consented records available for this view.",
        )

    emotions = [r.primary_emotion for r in records]
    languages = [r.detected_language for r in records]
    contexts = [r.context_category or "general" for r in records]
    confidences = [r.confidence for r in records]
    uncertain_count = sum(1 for r in records if r.is_uncertain)

    dept_aggregates: List[DepartmentAggregateItem] = []
    privacy_note = "Personal consented timeline."

    if effective_scope == "organization":
        min_group = settings.HR_MIN_AGGREGATION_THRESHOLD
        emp_depts = {e.id: (e.department or "General") for e in db.query(Employee).all()}
        by_dept = defaultdict(list)
        dept_emp_ids = defaultdict(set)
        for r in records:
            dept = emp_depts.get(r.employee_id, "General")
            by_dept[dept].append(r)
            dept_emp_ids[dept].add(r.employee_id)

        for dept, dept_records in sorted(by_dept.items()):
            distinct_emps = len(dept_emp_ids[dept])
            if distinct_emps < min_group:
                dept_aggregates.append(
                    DepartmentAggregateItem(
                        department=dept,
                        employee_count=distinct_emps,
                        record_count=len(dept_records),
                        suppressed_for_privacy=True,
                    )
                )
            else:
                d_emotions = [x.primary_emotion for x in dept_records]
                d_contexts = [x.context_category or "general" for x in dept_records]
                workload_count = sum(1 for c in d_contexts if c in ("workload", "stress"))
                positive_count = sum(1 for x in dept_records if x.polarity == "positive")
                dept_aggregates.append(
                    DepartmentAggregateItem(
                        department=dept,
                        employee_count=distinct_emps,
                        record_count=len(dept_records),
                        suppressed_for_privacy=False,
                        dominant_emotion=Counter(d_emotions).most_common(1)[0][0],
                        workload_concern_rate=round(workload_count / len(dept_records), 4),
                        positive_rate=round(positive_count / len(dept_records), 4),
                    )
                )
        privacy_note = (
            f"Aggregated HR view only (k-anonymity threshold: >= {min_group} employees per department). "
            "Private transcripts and individual profiles are never exposed."
        )

    return SentimentAnalyticsSummary(
        total_analyzed=len(records),
        dominant_emotion=Counter(emotions).most_common(1)[0][0],
        emotion_distribution=dict(Counter(emotions)),
        language_distribution=dict(Counter(languages)),
        context_distribution=dict(Counter(contexts)),
        average_confidence=round(sum(confidences) / len(confidences), 4),
        uncertainty_rate=round(uncertain_count / len(records), 4),
        department_aggregates=dept_aggregates,
        privacy_note=privacy_note,
    )
