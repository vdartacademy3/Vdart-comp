import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee
from ..models.sentiment import ModelEvaluationRecord
from ..schemas.evaluation import EvaluationRunRequest, EvaluationResponse
from ..auth.dependencies import get_current_employee, require_admin
from ..services.evaluation_service import evaluation_service

router = APIRouter(prefix="/evaluation", tags=["Model Evaluation Suite"])

@router.post("/run", response_model=EvaluationResponse)
def trigger_benchmark_evaluation(
    request: EvaluationRunRequest,
    current_employee: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Executes live factual evaluation on the 46 multilingual samples.
    Calculates exact Accuracy, Precision, Recall, Macro F1, and Confusion Matrix.
    """
    record = evaluation_service.run_benchmark(db, request.model_version)
    return EvaluationResponse(
        id=record.id,
        model_version=record.model_version,
        dataset_name=record.dataset_name,
        sample_count=record.sample_count,
        accuracy=record.accuracy,
        macro_f1=record.macro_f1,
        weighted_f1=record.weighted_f1,
        language_breakdown=json.loads(record.language_breakdown),
        per_class_metrics=json.loads(record.per_class_metrics),
        confusion_matrix=json.loads(record.confusion_matrix),
        evaluated_at=record.evaluated_at
    )

@router.get("/latest", response_model=EvaluationResponse)
def get_latest_evaluation(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Retrieves the most recent verified model evaluation run."""
    record = db.query(ModelEvaluationRecord).order_by(ModelEvaluationRecord.evaluated_at.desc()).first()
    if not record:
        # Run initial benchmark if none recorded yet
        record = evaluation_service.run_benchmark(db)

    return EvaluationResponse(
        id=record.id,
        model_version=record.model_version,
        dataset_name=record.dataset_name,
        sample_count=record.sample_count,
        accuracy=record.accuracy,
        macro_f1=record.macro_f1,
        weighted_f1=record.weighted_f1,
        language_breakdown=json.loads(record.language_breakdown),
        per_class_metrics=json.loads(record.per_class_metrics),
        confusion_matrix=json.loads(record.confusion_matrix),
        evaluated_at=record.evaluated_at
    )
