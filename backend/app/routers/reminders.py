from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import Employee
from ..models.reminder import Reminder
from ..schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from ..auth.dependencies import get_current_employee

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    status_filter: str = None,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Retrieve reminders strictly owned by the current employee."""
    query = db.query(Reminder).filter(Reminder.employee_id == current_employee.id)
    if status_filter:
        query = query.filter(Reminder.status == status_filter)
    return query.order_by(Reminder.due_time.asc()).all()

@router.post("", response_model=ReminderResponse)
def create_reminder(
    reminder_in: ReminderCreate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Create a new personal reminder for the employee."""
    rem = Reminder(
        employee_id=current_employee.id,
        title=reminder_in.title,
        description=reminder_in.description,
        due_time=reminder_in.due_time,
        status="pending"
    )
    db.add(rem)
    db.commit()
    db.refresh(rem)
    return rem

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    update_data: ReminderUpdate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Update or snooze reminder, strictly verifying employee ownership."""
    rem = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.employee_id == current_employee.id
    ).first()

    if not rem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found or access denied"
        )

    if update_data.title is not None:
        rem.title = update_data.title
    if update_data.description is not None:
        rem.description = update_data.description
    if update_data.due_time is not None:
        rem.due_time = update_data.due_time
    if update_data.status is not None:
        rem.status = update_data.status
    if update_data.snooze_minutes:
        rem.due_time = datetime.utcnow() + timedelta(minutes=update_data.snooze_minutes)
        rem.status = "snoozed"
        rem.snooze_count += 1

    db.commit()
    db.refresh(rem)
    return rem

@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    rem = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.employee_id == current_employee.id
    ).first()

    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found or access denied")

    db.delete(rem)
    db.commit()
    return {"message": "Reminder deleted successfully"}
