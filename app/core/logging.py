import logging
import sys
from contextvars import ContextVar
from typing import Optional

# Context variable for request ID tracking across async calls
request_id_ctx_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    """Log filter that injects the current request_id into each record."""
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx_var.get() or "system"
        return True


def setup_logging(debug: bool = False) -> logging.Logger:
    """Configure structured logging for the application."""
    log_level = logging.DEBUG if debug else logging.INFO
    logger = logging.getLogger("pyback")
    logger.setLevel(log_level)

    # Avoid adding duplicate handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)

        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [req:%(request_id)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(RequestIdFilter())
        logger.addHandler(handler)

    # Also attach the filter to root logger so third-party logs don't crash
    logging.getLogger().addFilter(RequestIdFilter())

    return logger


logger = setup_logging()
