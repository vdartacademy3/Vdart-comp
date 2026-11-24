from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models.user import Employee, EmployeeRole, EmployeeSession
from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_employee(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Employee:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    sub_val = payload.get("sub")
    if sub_val is None:
        raise credentials_exception

    try:
        employee_id = int(sub_val)
    except (ValueError, TypeError):
        raise credentials_exception

    # Check active session revocation in DB if recorded
    revoked_session = db.query(EmployeeSession).filter(
        EmployeeSession.token == token,
        EmployeeSession.is_revoked == True
    ).first()
    if revoked_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee or not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee account is deactivated or does not exist"
        )

    return employee

def require_admin(
    current_employee: Employee = Depends(get_current_employee)
) -> Employee:
    if current_employee.role not in [EmployeeRole.ADMIN, EmployeeRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_employee

def require_super_admin(
    current_employee: Employee = Depends(get_current_employee)
) -> Employee:
    if current_employee.role != EmployeeRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Administrator privileges required"
        )
    return current_employee

def verify_employee_tenant(employee_id: int, current_employee: Employee):
    """
    Strict Tenant Isolation Check:
    Ensures that an employee can ONLY access their own records.
    Even administrators must not silently masquerade as another employee's private session without authorization.
    """
    if current_employee.id != employee_id and current_employee.role != EmployeeRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you can only access your own data"
        )
