import os
import shutil
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from ..models.user import Employee
from ..models.companion import CompanionProfile, CompanionModelAsset
from ..config import settings

class CompanionService:
    @staticmethod
    def get_or_create_profile(db: Session, employee: Employee) -> CompanionProfile:
        """Retrieves or creates the personal companion profile for an employee."""
        profile = db.query(CompanionProfile).filter(CompanionProfile.employee_id == employee.id).first()
        if not profile:
            profile = CompanionProfile(
                employee_id=employee.id,
                companion_name=f"{employee.full_name}'s VCamp",
                personality_tone="supportive",
                active_language="auto",
                selected_voice="Microsoft Heera - English (India)",
                speech_rate=1.0,
                speech_pitch=1.0,
                auto_speak=True,
                robot_size="medium"
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        return profile

    @staticmethod
    def upload_3d_model(db: Session, employee: Employee, file: UploadFile) -> CompanionModelAsset:
        """Saves and associates a custom GLB/GLTF 3D model with the employee."""
        filename = file.filename or "custom_model.glb"
        ext = filename.split(".")[-1].lower()
        if ext not in ["glb", "gltf"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only .glb and .gltf 3D model formats are supported"
            )

        # Employee isolated directory
        emp_upload_dir = settings.UPLOAD_DIR / f"emp_{employee.id}"
        emp_upload_dir.mkdir(parents=True, exist_ok=True)
        
        target_path = emp_upload_dir / filename
        
        file_size = 0
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            file_size = target_path.stat().st_size

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            target_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB"
            )

        # Deactivate any previous active model for this employee
        db.query(CompanionModelAsset).filter(
            CompanionModelAsset.employee_id == employee.id
        ).update({"is_active": False})

        # Save model record
        model_asset = CompanionModelAsset(
            employee_id=employee.id,
            model_name=filename,
            file_path=str(target_path),
            file_size_bytes=file_size,
            model_format=ext,
            is_active=True
        )
        db.add(model_asset)
        db.commit()
        db.refresh(model_asset)
        return model_asset

companion_service = CompanionService()
