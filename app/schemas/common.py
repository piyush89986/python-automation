from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class StandardResponse(BaseModel, Generic[DataT]):
    """Standardized API response format."""
    status: str = "success"
    message: Optional[str] = None
    data: Optional[DataT] = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    status: str = "error"
    error: ErrorDetail


class HealthComponentStatus(BaseModel):
    status: str  # "healthy" | "unhealthy" | "disabled"
    latency_ms: Optional[float] = None
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    environment: str = "development"
    uptime_seconds: float = 0.0
    services: dict[str, HealthComponentStatus] = Field(default_factory=dict)


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    pages: int


class PaginatedResponse(BaseModel, Generic[DataT]):
    status: str = "success"
    data: List[DataT]
    pagination: PaginationMeta
