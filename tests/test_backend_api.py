"""Automated Backend API, Security, Consent, HR Aggregation & Evaluation Verification Suite.

Runs directly against FastAPI route handlers, Pydantic schemas, SQLAlchemy SQLite DB,
Argon2id + JWT authentication guards, and scikit-learn sentiment evaluation without
requiring socketpair creation.
"""
import os
import sys
import tempfile
from pathlib import Path

from fastapi import HTTPException

TEST_DATA_DIR = tempfile.mkdtemp(prefix="vcamp_test_")
os.environ["VCAMP_DATA_DIR"] = TEST_DATA_DIR
os.environ["VCAMP_USE_LOCAL_DEV_DB"] = "0"
os.environ["VCAMP_ENABLE_DEMO_ACCOUNTS"] = "0"
os.environ["VCAMP_HR_MIN_GROUP_SIZE"] = "3"

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.auth.dependencies import get_current_employee, require_admin  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import init_db  # noqa: E402
from app.routers import auth, companion, conversations, evaluation, sentiment, system  # noqa: E402
from app.schemas.auth import RegisterRequest  # noqa: E402
from app.schemas.companion import CompanionProfileUpdate  # noqa: E402
from app.schemas.conversation import ChatRequest  # noqa: E402
from app.schemas.evaluation import EvaluationRunRequest  # noqa: E402
from app.schemas.sentiment import SentimentAnalyzeRequest  # noqa: E402


def drive_sync(coro):
    """Step an async coroutine without socketpair/event-loop allocation when non-blocking."""
    try:
        coro.send(None)
        raise AssertionError("Unexpected suspension in offline verification")
    except StopIteration as stop:
        return stop.value


def run_all():
    init_db()
    db = SessionLocal()
    try:
        # 1. Health check
        health = system.system_health(db=db)
        assert health["status"] == "healthy"
        assert health["version"] == "3.0.0"

        # 2. First user bootstraps SUPER_ADMIN; second user cannot self-escalate
        r1 = auth.register(
            RegisterRequest(
                email="admin@example.com",
                username="admin1",
                full_name="Admin User",
                password="StrongPassword@123",
                department="Executive",
            ),
            db,
        )
        assert r1.role == "SUPER_ADMIN"
        admin_emp = get_current_employee(token=r1.access_token, db=db)
        assert require_admin(current_employee=admin_emp).id == admin_emp.id

        r2 = auth.register(
            RegisterRequest(
                email="emp1@example.com",
                username="emp1",
                full_name="Employee One",
                password="StrongPassword@123",
                department="Engineering",
            ),
            db,
        )
        assert r2.role == "EMPLOYEE", "Register must force EMPLOYEE role after bootstrap"
        emp1 = get_current_employee(token=r2.access_token, db=db)

        rbac_blocked = False
        try:
            require_admin(current_employee=emp1)
        except HTTPException as exc:
            rbac_blocked = exc.status_code == 403
        assert rbac_blocked, "Employee must be denied admin access (403)"

        r3 = auth.register(
            RegisterRequest(
                email="emp2@example.com",
                username="emp2",
                full_name="Employee Two",
                password="StrongPassword@123",
                department="Engineering",
            ),
            db,
        )
        emp2 = get_current_employee(token=r3.access_token, db=db)

        # 3. Companion profile character + consent persistence
        prof = companion.update_companion_profile(
            CompanionProfileUpdate(selected_character_id="athletic_man", consent_sentiment=True),
            current_employee=emp1,
            db=db,
        )
        assert prof.selected_character_id == "athletic_man"
        assert prof.consent_sentiment is True

        # 4. Chat contract + sentiment analysis + context_category
        chat1 = drive_sync(
            conversations.chat_with_companion(
                ChatRequest(message="Too much workload and deadline pressure today!", session_id="s1"),
                current_employee=emp1,
                db=db,
            )
        )
        assert chat1.companion_message.text
        assert chat1.context_category == "workload"

        chat2 = drive_sync(
            conversations.chat_with_companion(
                ChatRequest(
                    conversation_id=chat1.conversation_id,
                    message="Still buried under deadline workload",
                    session_id="s1",
                ),
                current_employee=emp1,
                db=db,
            )
        )
        assert chat2.context_category == "workload"

        # 5. HR aggregation k-anonymity guardrail (< 3 employees in Engineering -> suppressed!)
        sentiment.analyze_text(SentimentAnalyzeRequest(text="Feeling happy today!"), current_employee=emp2, db=db)
        hr1 = sentiment.get_sentiment_analytics(scope="organization", current_employee=admin_emp, db=db)
        eng1 = [d for d in hr1.department_aggregates if d.department == "Engineering"]
        assert len(eng1) == 1 and eng1[0].suppressed_for_privacy is True

        r4 = auth.register(
            RegisterRequest(
                email="emp3@example.com",
                username="emp3",
                full_name="Employee Three",
                password="StrongPassword@123",
                department="Engineering",
            ),
            db,
        )
        emp3 = get_current_employee(token=r4.access_token, db=db)
        sentiment.analyze_text(
            SentimentAnalyzeRequest(text="Feeling calm and motivated."), current_employee=emp3, db=db
        )
        hr2 = sentiment.get_sentiment_analytics(scope="organization", current_employee=admin_emp, db=db)
        eng2 = [d for d in hr2.department_aggregates if d.department == "Engineering"]
        assert eng2[0].suppressed_for_privacy is False
        assert eng2[0].employee_count == 3

        # 6. Consent opt-out stops storing predictions + delete personal history works
        companion.update_companion_profile(
            CompanionProfileUpdate(consent_sentiment=False), current_employee=emp1, db=db
        )
        before = len(sentiment.get_sentiment_history(limit=50, current_employee=emp1, db=db))
        sentiment.analyze_text(
            SentimentAnalyzeRequest(text="This should not be persisted"), current_employee=emp1, db=db
        )
        after = len(sentiment.get_sentiment_history(limit=50, current_employee=emp1, db=db))
        assert after == before

        del_res = sentiment.delete_my_sentiment_history(current_employee=emp1, db=db)
        assert del_res["deleted_records"] >= 1
        assert len(sentiment.get_sentiment_history(limit=50, current_employee=emp1, db=db)) == 0

        # 7. Tenant isolation: emp2 cannot read emp1 conversation
        tenant_blocked = False
        try:
            conversations.get_conversation(conversation_id=chat1.conversation_id, current_employee=emp2, db=db)
        except HTTPException as exc:
            tenant_blocked = exc.status_code == 404
        assert tenant_blocked, "Cross-employee conversation read must fail with 404"

        # 8. Empirical 46-sample evaluation benchmark
        eval_res = evaluation.trigger_benchmark_evaluation(
            EvaluationRunRequest(model_version="vcamp-multilingual-v3.0"),
            current_employee=admin_emp,
            db=db,
        )
        assert eval_res.sample_count == 46
        assert eval_res.accuracy >= 0.85

        # 9. Database backup & privacy export endpoints
        bkp = system.create_database_backup(current_employee=admin_emp)
        assert bkp["backup_file"].endswith(".db")
        exp = system.export_personal_data(current_employee=emp1, db=db)
        assert exp["employee"]["email"] == "emp1@example.com"

        print("ALL BACKEND API, SECURITY, CONSENT, HR PRIVACY & SENTIMENT TESTS PASSED!")
    finally:
        db.close()


if __name__ == "__main__":
    run_all()
