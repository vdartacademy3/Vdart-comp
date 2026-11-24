from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee, EmployeeRole, AuditLog
from ..schemas.employee import EmployeeResponse, EmployeeUpdate
from ..schemas.auth import RegisterRequest
from ..auth.security import hash_password
from ..auth.dependencies import get_current_employee, require_admin, require_super_admin

router = APIRouter(prefix="/employees", tags=["Employee Management"])

@router.get("", response_model=List[EmployeeResponse])
def list_employees(
    current_employee: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin / Super Admin endpoint to list all employees."""
    return db.query(Employee).all()

@router.post("", response_model=EmployeeResponse)
def create_employee(
    request: RegisterRequest,
    current_employee: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to create a new employee account."""
    if db.query(Employee).filter(Employee.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(Employee).filter(Employee.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_emp = Employee(
        email=request.email,
        username=request.username,
        full_name=request.full_name,
        hashed_password=hash_password(request.password),
        role=request.role or EmployeeRole.EMPLOYEE,
        department=request.department or "Engineering"
    )
    db.add(new_emp)
    
    audit = AuditLog(
        employee_id=current_employee.id,
        action="CREATE_EMPLOYEE",
        resource=f"EMPLOYEE_{request.email}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    # Only allow self or admin to view employee metadata
    if current_employee.id != employee_id and current_employee.role not in [EmployeeRole.ADMIN, EmployeeRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to view this employee")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    update_data: EmployeeUpdate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    # Only allow self or admin
    if current_employee.id != employee_id and current_employee.role not in [EmployeeRole.ADMIN, EmployeeRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this employee")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if update_data.full_name is not None:
        emp.full_name = update_data.full_name
    if update_data.department is not None:
        emp.department = update_data.department
    
    # Role updates require Super Admin
    if update_data.role is not None:
        if current_employee.role != EmployeeRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only Super Admins can modify employee roles")
        emp.role = update_data.role

    if update_data.is_active is not None:
        if current_employee.role not in [EmployeeRole.ADMIN, EmployeeRole.SUPER_ADMIN]:
            raise HTTPException(status_code=403, detail="Only Admins can toggle account active status")
        emp.is_active = update_data.is_active

    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    current_employee: Employee = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(emp)
    audit = AuditLog(
        employee_id=current_employee.id,
        action="DELETE_EMPLOYEE",
        resource=f"EMPLOYEE_{employee_id}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Employee {employee_id} deleted successfully"}
