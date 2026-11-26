from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
from ..models.companion import CompanionProfile
from ..models.sentiment import SentimentPrediction, QuestionInteraction


PATTERN_QUESTIONS = {
    "workload": {
        "key": "pattern_workload_checkin",
        "text": "Has your workload been difficult recently?",
        "options": [
            "Yes, deadlines are tight",
            "Somewhat busy, but manageable",
            "No, workload feels balanced",
        ],
    },
    "motivation": {
        "key": "pattern_motivation_checkin",
        "text": "Is anything affecting your motivation?",
        "options": [
            "Unclear priorities or blockers",
            "Energy or fatigue today",
            "All good, just taking it steady",
        ],
    },
    "frustration": {
        "key": "pattern_frustration_checkin",
        "text": "Would you like to talk about what's bothering you?",
        "options": [
            "Yes, let's break down the issue",
            "Just venting, I'm okay now",
            "Not right now",
        ],
    },
    "positive": {
        "key": "pattern_positive_checkin",
        "text": "What went well today?",
        "options": [
            "Finished an important task",
            "Great collaboration with the team",
            "Smooth focus and progress",
        ],
    },
}


class IntelligentQuestionService:
    """Context-aware, non-intrusive question generator with cooldowns & quiet hours."""

    COOLDOWN_MINUTES = 120
    DAILY_CAP = 3

    @staticmethod
    def is_quiet_hours(profile: Optional[CompanionProfile]) -> bool:
        if not profile or not profile.quiet_hours_enabled:
            return False
        now = datetime.now()
        curr_mins = now.hour * 60 + now.minute
        try:
            sh, sm = [int(x) for x in (profile.quiet_hours_start or "22:00").split(":")]
            eh, em = [int(x) for x in (profile.quiet_hours_end or "08:00").split(":")]
        except ValueError:
            return False
        start_total = sh * 60 + sm
        end_total = eh * 60 + em
        if start_total <= end_total:
            return start_total <= curr_mins < end_total
        return curr_mins >= start_total or curr_mins < end_total

    @classmethod
    def get_contextual_suggestion(
        cls,
        db: Session,
        employee_id: int,
        profile: Optional[CompanionProfile],
    ) -> Optional[Dict]:
        if profile and not profile.consent_questions:
            return None
        if cls.is_quiet_hours(profile):
            return None

        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = (
            db.query(QuestionInteraction)
            .filter(
                QuestionInteraction.employee_id == employee_id,
                QuestionInteraction.created_at >= today_start,
            )
            .count()
        )
        if today_count >= cls.DAILY_CAP:
            return None

        last_q = (
            db.query(QuestionInteraction)
            .filter(QuestionInteraction.employee_id == employee_id)
            .order_by(QuestionInteraction.created_at.desc())
            .first()
        )
        if last_q and (now - last_q.created_at) < timedelta(minutes=cls.COOLDOWN_MINUTES):
            return None

        recent = (
            db.query(SentimentPrediction)
            .filter(
                SentimentPrediction.employee_id == employee_id,
                SentimentPrediction.is_deleted == False,
            )
            .order_by(SentimentPrediction.created_at.desc())
            .limit(5)
            .all()
        )
        if len(recent) < 2:
            return None

        contexts = [r.context_category for r in recent]
        emotions = [r.primary_emotion for r in recent]

        selected_pattern = None
        if contexts.count("workload") >= 2 or emotions.count("stressed") >= 2:
            selected_pattern = "workload"
        elif contexts.count("frustration") >= 2 or emotions.count("frustrated") >= 2:
            selected_pattern = "frustration"
        elif emotions.count("tired") >= 2 or emotions.count("disappointed") >= 2:
            selected_pattern = "motivation"
        elif contexts.count("positive") >= 3:
            selected_pattern = "positive"

        if not selected_pattern:
            return None

        q = PATTERN_QUESTIONS[selected_pattern]
        if last_q and last_q.question_key == q["key"] and (now - last_q.created_at) < timedelta(hours=12):
            return None

        return {
            "question_key": q["key"],
            "question_text": q["text"],
            "trigger_context": selected_pattern,
            "options": q["options"],
        }


question_service = IntelligentQuestionService()
