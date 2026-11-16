from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import logger
from app.core.database import engine, redis_client, check_database_connection, check_redis_connection
from app.core.middleware import RequestContextMiddleware
from app.core.errors import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.api.v1.router import api_router
from app.api.v1.endpoints.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager handling application startup and graceful shutdown."""
    logger.info(f"Starting {settings.APP_NAME} in [{settings.APP_ENV}] mode...")

    # Validate database connection
    db_ok = await check_database_connection()
    if db_ok:
        logger.info("Connected to PostgreSQL successfully.")
        try:
            from app.core.database import AsyncSessionFactory
            from app.core.init_db import init_super_admin
            async with AsyncSessionFactory() as session:
                await init_super_admin(session)
        except Exception as e:
            logger.warning(f"Could not bootstrap initial super admin: {e}")
    else:
        logger.warning("Could not establish immediate PostgreSQL connection.")

    # Validate Redis connection
    redis_ok = await check_redis_connection()
    if redis_ok:
        logger.info("Connected to Redis successfully.")
    else:
        logger.warning("Could not establish immediate Redis connection.")

    yield

    # Graceful shutdown
    logger.info("Shutting down application resources...")
    try:
        await redis_client.aclose()
        logger.info("Redis connection pool closed.")
    except Exception as e:
        logger.error(f"Error closing Redis: {e}")

    try:
        await engine.dispose()
        logger.info("PostgreSQL engine connection pool disposed.")
    except Exception as e:
        logger.error(f"Error disposing database engine: {e}")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Production-grade, multi-tenant AI chatbot backend for Instagram and WhatsApp.",
    openapi_url="/api/v1/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request context and performance tracking middleware
app.add_middleware(RequestContextMiddleware)

# Custom Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Top-level Health check for load-balancers & Render
app.include_router(health_router, tags=["Health"])

# API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "success",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
    }
