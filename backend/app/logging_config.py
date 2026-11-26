import logging
import re
from logging.handlers import RotatingFileHandler
from .config import settings

_SENSITIVE_PATTERNS = [
    (re.compile(r"(Bearer\s+)[A-Za-z0-9\-_\.]+", re.IGNORECASE), r"\1[REDACTED]"),
    (re.compile(r"(gsk_[A-Za-z0-9]{8,})", re.IGNORECASE), "[REDACTED_API_KEY]"),
    (re.compile(r"(sk-[A-Za-z0-9\-_]{8,})", re.IGNORECASE), "[REDACTED_API_KEY]"),
    (re.compile(r'("(?:password|api_key|token|access_token|secret)"\s*:\s*")[^"]*(")', re.IGNORECASE), r"\1[REDACTED]\2"),
]


class RedactingFormatter(logging.Formatter):
    """Formats log records while redacting tokens, passwords, and API keys."""

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        for pattern, replacement in _SENSITIVE_PATTERNS:
            msg = pattern.sub(replacement, msg)
        return msg


def configure_logging() -> logging.Logger:
    logger = logging.getLogger("vcamp")
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    fmt = RedactingFormatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    console = logging.StreamHandler()
    console.setFormatter(fmt)
    logger.addHandler(console)

    log_file = settings.LOG_DIR / "vcamp_backend.log"
    file_handler = RotatingFileHandler(
        log_file, maxBytes=2 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setFormatter(fmt)
    logger.addHandler(file_handler)
    return logger


logger = configure_logging()
