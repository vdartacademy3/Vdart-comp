from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime

class EvaluationRunRequest(BaseModel):
    model_version: str = "vcamp-multilingual-v2.0"
    dataset_name: str = "vcamp-multilingual-benchmark-46"

class EvaluationResponse(BaseModel):
    id: int
    model_version: str
    dataset_name: str
    sample_count: int
    accuracy: float
    macro_f1: float
    weighted_f1: float
    language_breakdown: Dict[str, Any]
    per_class_metrics: Dict[str, Any]
    confusion_matrix: Dict[str, Any]
    evaluated_at: datetime

    class Config:
        from_attributes = True
