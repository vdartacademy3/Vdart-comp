import json
from collections import Counter
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee, EmployeeRole
from ..models.sentiment import SentimentPrediction
from ..schemas.sentiment import (
    SentimentAnalyzeRequest, 
    SentimentAnalyzeResponse, 
    SentimentHistoryItem, 
    SentimentAnalyticsSummary
)
from ..auth.dependencies import get_current_employee
from ..services.sentiment_service import sentiment_classifier

router = APIRouter(prefix="/sentiment", tags=["Sentiment Intelligence"])

@router.post("/analyze", response_model=SentimentAnalyzeResponse)
def analyze_text(
    request: SentimentAnalyzeRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Analyzes input text across 15 emotion categories for Tamil, Tanglish, and English.
    Saves isolated prediction record under current employee.
    """
    res = sentiment_classifier.classify(request.text)

    # Store prediction record
    prediction = SentimentPrediction(
        employee_id=current_employee.id,
        message_text=request.text,
        primary_emotion=res["primary_emotion"],
        secondary_emotion=res["secondary_emotion"],
        confidence=res["confidence"],
        detected_language=res["detected_language"],
        polarity=res["polarity"],
        per_class_scores=json.dumps(res["per_class_scores"]),
        is_uncertain=res["is_uncertain"]
    )
    db.add(prediction)
    db.commit()

    return SentimentAnalyzeResponse(
        primary_emotion=res["primary_emotion"],
        secondary_emotion=res["secondary_emotion"],
        confidence=res["confidence"],
        per_class_scores=res["per_class_scores"],
        detected_language=res["detected_language"],
        polarity=res["polarity"],
        model_version=res["model_version"],
        prediction_timestamp=res["prediction_timestamp"],
        is_uncertain=res["is_uncertain"]
    )

@router.get("/history", response_model=List[SentimentHistoryItem])
def get_sentiment_history(
    limit: int = Query(50, ge=1, le=200),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Returns the authenticated employee's isolated sentiment timeline."""
    return db.query(SentimentPrediction).filter(
        SentimentPrediction.employee_id == current_employee.id
    ).order_by(SentimentPrediction.created_at.desc()).limit(limit).all()

@router.get("/analytics", response_model=SentimentAnalyticsSummary)
def get_sentiment_analytics(
    scope: str = Query("personal", pattern="^(personal|organization)$"),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Role-based analytics:
    - Employees see strictly their personal emotion distribution.
    - Admins requesting 'organization' scope see aggregated counts without employee identifiers or conversation surveillance.
    """
    query = db.query(SentimentPrediction)
    
    if scope == "personal" or current_employee.role == EmployeeRole.EMPLOYEE:
        query = query.filter(SentimentPrediction.employee_id == current_employee.id)

    records = query.all()
    if not records:
        return SentimentAnalyticsSummary(
            total_analyzed=0,
            dominant_emotion="neutral",
            emotion_distribution={},
            language_distribution={},
            average_confidence=0.0,
            uncertainty_rate=0.0
        )

    emotions = [r.primary_emotion for r in records]
    languages = [r.detected_language for r in records]
    confidences = [r.confidence for r in records]
    uncertain_count = sum(1 for r in records if r.is_uncertain)

    emotion_counts = dict(Counter(emotions))
    language_counts = dict(Counter(languages))
    dominant = Counter(emotions).most_common(1)[0][0]

    return SentimentAnalyticsSummary(
        total_analyzed=len(records),
        dominant_emotion=dominant,
        emotion_distribution=emotion_counts,
        language_distribution=language_counts,
        average_confidence=round(sum(confidences) / len(confidences), 4),
        uncertainty_rate=round(uncertain_count / len(records), 4)
    )
