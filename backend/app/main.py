import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base, SessionLocal
from .logging_config import logger
from .migrations import run_migrations
from .models.user import Employee, EmployeeRole
from .auth.security import hash_password
from .services.companion_service import companion_service

from .routers import (
    auth,
    employees,
    companion,
    conversations,
    sentiment,
    reminders,
    evaluation,
    questions,
    system,
)


def init_db():
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)

    if not settings.ENABLE_DEMO_ACCOUNTS:
        return

    admin_pw = os.getenv("VCAMP_DEMO_ADMIN_PASSWORD", "").strip()
    user_pw = os.getenv("VCAMP_DEMO_USER_PASSWORD", "").strip()
    if not admin_pw or not user_pw:
        return

    db = SessionLocal()
    try:
        demo_specs = [
            (
                "admin@vcamp.ai",
                "admin",
                "VCamp Administrator",
                admin_pw,
                EmployeeRole.SUPER_ADMIN,
                "Executive",
            ),
            (
                "employee@vcamp.ai",
                "employee",
                "VCamp Employee",
                user_pw,
                EmployeeRole.EMPLOYEE,
                "Engineering",
            ),
        ]
        for email, username, full_name, raw_pw, role, dept in demo_specs:
            existing = db.query(Employee).filter(Employee.email == email).first()
            if existing is None:
                emp = Employee(
                    email=email,
                    username=username,
                    full_name=full_name,
                    hashed_password=hash_password(raw_pw),
                    role=role,
                    department=dept,
                    is_active=True,
                )
                db.add(emp)
                db.commit()
                db.refresh(emp)
                companion_service.get_or_create_profile(db, emp)
            else:
                existing.hashed_password = hash_password(raw_pw)
                existing.role = role
                existing.is_active = True
                db.commit()
                companion_service.get_or_create_profile(db, existing)
        logger.info("Synchronized configured demo accounts (admin@vcamp.ai, employee@vcamp.ai).")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("VCamp Backend initialized (data_dir=%s)", settings.DATA_DIR)
    yield
    logger.info("VCamp Backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(companion.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(sentiment.router, prefix=settings.API_V1_STR)
app.include_router(reminders.router, prefix=settings.API_V1_STR)
app.include_router(evaluation.router, prefix=settings.API_V1_STR)
app.include_router(questions.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/api/docs",
    }
