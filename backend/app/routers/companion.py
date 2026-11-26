from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee, AuditLog
from ..models.companion import CompanionModelAsset
from ..schemas.companion import (
    CompanionProfileResponse,
    CompanionProfileUpdate,
    CompanionModelAssetResponse,
)
from ..auth.dependencies import get_current_employee
from ..services.companion_service import companion_service

router = APIRouter(prefix="/companion", tags=["Personalized Companion"])


@router.get("/profile", response_model=CompanionProfileResponse)
def get_companion_profile(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return companion_service.get_or_create_profile(db, current_employee)


@router.put("/profile", response_model=CompanionProfileResponse)
def update_companion_profile(
    update_data: CompanionProfileUpdate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    profile = companion_service.get_or_create_profile(db, current_employee)
    payload = update_data.model_dump(exclude_unset=True)

    consent_keys = {"consent_sentiment", "consent_memory", "consent_questions", "retention_days"}
    if any(k in payload for k in consent_keys):
        profile.consent_updated_at = datetime.utcnow()
        db.add(
            AuditLog(
                employee_id=current_employee.id,
                action="UPDATE_CONSENT",
                resource="COMPANION_PROFILE",
            )
        )

    for key, value in payload.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/model/upload", response_model=CompanionModelAssetResponse)
def upload_companion_model(
    file: UploadFile = File(...),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return companion_service.upload_3d_model(db, current_employee, file)


@router.get("/models", response_model=List[CompanionModelAssetResponse])
def list_employee_models(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(CompanionModelAsset)
        .filter(CompanionModelAsset.employee_id == current_employee.id)
        .order_by(CompanionModelAsset.uploaded_at.desc())
        .all()
    )
