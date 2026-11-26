from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee, EmployeeRole, EmployeeSession, AuditLog
from ..schemas.auth import RegisterRequest, LoginRequest, PasswordResetRequest, TokenResponse
from ..schemas.employee import EmployeeResponse
from ..auth.security import hash_password, verify_password, create_access_token
from ..auth.dependencies import get_current_employee
from ..services.companion_service import companion_service
from ..logging_config import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    if db.query(Employee).filter(Employee.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")

    hashed = hash_password(request.password)

    # First user bootstraps SUPER_ADMIN; all subsequent self-registrations are strictly EMPLOYEE.
    is_first_user = db.query(Employee).count() == 0
    assigned_role = EmployeeRole.SUPER_ADMIN if is_first_user else EmployeeRole.EMPLOYEE

    new_emp = Employee(
        email=request.email,
        username=request.username,
        full_name=request.full_name,
        hashed_password=hashed,
        role=assigned_role,
        department=request.department or "Engineering",
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    companion_service.get_or_create_profile(db, new_emp)

    token = create_access_token(
        data={"sub": str(new_emp.id), "email": new_emp.email, "role": new_emp.role.value}
    )

    db.add(
        EmployeeSession(
            employee_id=new_emp.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
    )
    db.add(AuditLog(employee_id=new_emp.id, action="REGISTER", resource="AUTH"))
    db.commit()
    logger.info("Registered new account id=%s role=%s", new_emp.id, assigned_role.value)

    return TokenResponse(
        access_token=token,
        employee_id=new_emp.id,
        email=new_emp.email,
        username=new_emp.username,
        full_name=new_emp.full_name,
        role=new_emp.role,
        department=new_emp.department,
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    employee = (
        db.query(Employee)
        .filter((Employee.email == request.login) | (Employee.username == request.login))
        .first()
    )

    if not employee or not verify_password(request.password, employee.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not employee.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    companion_service.get_or_create_profile(db, employee)

    token = create_access_token(
        data={"sub": str(employee.id), "email": employee.email, "role": employee.role.value}
    )

    db.add(
        EmployeeSession(
            employee_id=employee.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
    )
    db.add(AuditLog(employee_id=employee.id, action="LOGIN", resource="AUTH"))
    db.commit()

    return TokenResponse(
        access_token=token,
        employee_id=employee.id,
        email=employee.email,
        username=employee.username,
        full_name=employee.full_name,
        role=employee.role,
        department=employee.department,
    )


@router.post("/logout")
def logout(current_employee: Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    db.query(EmployeeSession).filter(
        EmployeeSession.employee_id == current_employee.id,
        EmployeeSession.is_revoked == False,
    ).update({"is_revoked": True})

    db.add(AuditLog(employee_id=current_employee.id, action="LOGOUT", resource="AUTH"))
    db.commit()
    return {"message": "Successfully logged out and session revoked"}


@router.get("/me", response_model=EmployeeResponse)
def get_me(current_employee: Employee = Depends(get_current_employee)):
    return current_employee


@router.post("/reset-password")
def reset_password(
    request: PasswordResetRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    if not verify_password(request.current_password, current_employee.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    current_employee.hashed_password = hash_password(request.new_password)
    db.add(AuditLog(employee_id=current_employee.id, action="RESET_PASSWORD", resource="AUTH"))
    db.commit()
    return {"message": "Password successfully updated"}
