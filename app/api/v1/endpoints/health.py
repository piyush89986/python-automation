import time
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import check_database_connection, check_redis_connection
from app.schemas.common import HealthResponse, HealthComponentStatus

router = APIRouter()

APP_START_TIME = time.time()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Asynchronously checks application uptime, database connection, and Redis status.",
)
async def health_check():
    now = time.time()
    uptime = round(now - APP_START_TIME, 2)

    # Check Database
    db_start = time.perf_counter()
    db_healthy = await check_database_connection()
    db_latency = round((time.perf_counter() - db_start) * 1000, 2)

    # Check Redis
    redis_start = time.perf_counter()
    redis_healthy = await check_redis_connection()
    redis_latency = round((time.perf_counter() - redis_start) * 1000, 2)

    services = {
        "database": HealthComponentStatus(
            status="healthy" if db_healthy else "unhealthy",
            latency_ms=db_latency,
            details="PostgreSQL connection operational" if db_healthy else "Connection failed",
        ),
        "redis": HealthComponentStatus(
            status="healthy" if redis_healthy else "unhealthy",
            latency_ms=redis_latency,
            details="Redis cache/queue operational" if redis_healthy else "Connection failed",
        ),
    }

    is_overall_healthy = db_healthy and redis_healthy
    overall_status = "healthy" if is_overall_healthy else "degraded"

    payload = HealthResponse(
        status=overall_status,
        version="1.0.0",
        environment=settings.APP_ENV,
        uptime_seconds=uptime,
        services=services,
    )

    # If in development or services unavailable, return 200 with degraded state or 503 for strict readiness
    return JSONResponse(
        status_code=status.HTTP_200_OK if is_overall_healthy or settings.APP_ENV == "development" else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload.model_dump(),
    )
