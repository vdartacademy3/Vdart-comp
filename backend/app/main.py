from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base, SessionLocal
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
    system
)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default Super Admin if no employees exist
        if db.query(Employee).count() == 0:
            super_admin = Employee(
                email="admin@vcamp.ai",
                username="admin",
                full_name="VCamp Super Administrator",
                hashed_password=hash_password("Admin@12345"),
                role=EmployeeRole.SUPER_ADMIN,
                department="Executive"
            )
            db.add(super_admin)
            db.commit()
            db.refresh(super_admin)
            companion_service.get_or_create_profile(db, super_admin)

            # Seed demo employee account
            demo_emp = Employee(
                email="employee@vcamp.ai",
                username="employee",
                full_name="Aathil Employee",
                hashed_password=hash_password("Employee@12345"),
                role=EmployeeRole.EMPLOYEE,
                department="Engineering"
            )
            db.add(demo_emp)
            db.commit()
            db.refresh(demo_emp)
            companion_service.get_or_create_profile(db, demo_emp)
            print(">>> [VCamp Backend] Seeded default Super Admin (admin@vcamp.ai) & Employee (employee@vcamp.ai)")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print(">>> [VCamp Backend] Server initialized with Argon2id auth and strict tenant isolation.")
    yield
    # Shutdown
    print(">>> [VCamp Backend] Server shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(companion.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(sentiment.router, prefix=settings.API_V1_STR)
app.include_router(reminders.router, prefix=settings.API_V1_STR)
app.include_router(evaluation.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

# Mount 3D Model Assets Storage
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {
        "message": "VCamp Enterprise AI Backend is running",
        "documentation": "/api/docs",
        "version": settings.VERSION
    }
