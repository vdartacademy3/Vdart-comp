from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee
from ..models.companion import CompanionProfile, CompanionModelAsset
from ..schemas.companion import (
    CompanionProfileResponse, 
    CompanionProfileUpdate, 
    CompanionModelAssetResponse
)
from ..auth.dependencies import get_current_employee
from ..services.companion_service import companion_service

router = APIRouter(prefix="/companion", tags=["Personalized Companion"])

@router.get("/profile", response_model=CompanionProfileResponse)
def get_companion_profile(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Returns the authenticated employee's personal companion profile."""
    return companion_service.get_or_create_profile(db, current_employee)

@router.put("/profile", response_model=CompanionProfileResponse)
def update_companion_profile(
    update_data: CompanionProfileUpdate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Updates the authenticated employee's personal companion settings."""
    profile = companion_service.get_or_create_profile(db, current_employee)
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/model/upload", response_model=CompanionModelAssetResponse)
def upload_companion_model(
    file: UploadFile = File(...),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Uploads a personal .GLB or .GLTF 3D humanoid model for this employee."""
    return companion_service.upload_3d_model(db, current_employee, file)

@router.get("/models", response_model=List[CompanionModelAssetResponse])
def list_employee_models(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Lists all uploaded 3D models for this employee."""
    return db.query(CompanionModelAsset).filter(
        CompanionModelAsset.employee_id == current_employee.id
    ).order_by(CompanionModelAsset.uploaded_at.desc()).all()
