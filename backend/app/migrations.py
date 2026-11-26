from sqlalchemy import text
from sqlalchemy.engine import Engine
from .logging_config import logger


def _existing_columns(conn, table_name: str) -> set[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return {row[1] for row in rows}


def _add_column_if_missing(conn, table: str, col: str, ddl_type: str) -> None:
    cols = _existing_columns(conn, table)
    if cols and col not in cols:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl_type}"))
        logger.info("Migration added column %s.%s", table, col)


def run_migrations(engine: Engine) -> None:
    """Idempotent schema migration runner for SQLite databases."""
    if not str(engine.url).startswith("sqlite"):
        return

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        applied = {
            row[0]
            for row in conn.execute(text("SELECT version FROM schema_migrations")).fetchall()
        }

        if 1 not in applied:
            # v1: Companion consent, character selection, AI provider config
            _add_column_if_missing(conn, "companion_profiles", "selected_character_id", "VARCHAR(80) DEFAULT 'vcamp_robot'")
            _add_column_if_missing(conn, "companion_profiles", "character_settings_json", "TEXT")
            _add_column_if_missing(conn, "companion_profiles", "ai_provider", "VARCHAR(40) DEFAULT 'groq'")
            _add_column_if_missing(conn, "companion_profiles", "ai_model", "VARCHAR(120) DEFAULT 'llama-3.3-70b-versatile'")
            _add_column_if_missing(conn, "companion_profiles", "consent_sentiment", "BOOLEAN DEFAULT 1")
            _add_column_if_missing(conn, "companion_profiles", "consent_memory", "BOOLEAN DEFAULT 1")
            _add_column_if_missing(conn, "companion_profiles", "consent_questions", "BOOLEAN DEFAULT 1")
            _add_column_if_missing(conn, "companion_profiles", "retention_days", "INTEGER DEFAULT 90")
            _add_column_if_missing(conn, "companion_profiles", "quiet_hours_enabled", "BOOLEAN DEFAULT 1")
            _add_column_if_missing(conn, "companion_profiles", "quiet_hours_start", "VARCHAR(10) DEFAULT '22:00'")
            _add_column_if_missing(conn, "companion_profiles", "quiet_hours_end", "VARCHAR(10) DEFAULT '08:00'")
            _add_column_if_missing(conn, "companion_profiles", "consent_updated_at", "DATETIME")

            # v1: Sentiment context, session tracking, feedback & soft delete
            _add_column_if_missing(conn, "sentiment_predictions", "session_id", "VARCHAR(100)")
            _add_column_if_missing(conn, "sentiment_predictions", "context_category", "VARCHAR(50) DEFAULT 'general'")
            _add_column_if_missing(conn, "sentiment_predictions", "user_feedback", "VARCHAR(100)")
            _add_column_if_missing(conn, "sentiment_predictions", "is_deleted", "BOOLEAN DEFAULT 0")

            conn.execute(
                text(
                    "INSERT INTO schema_migrations (version, name) VALUES (1, 'consent_character_sentiment_v3')"
                )
            )
            logger.info("Applied database migration v1: consent_character_sentiment_v3")
