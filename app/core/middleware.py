import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import logger, request_id_ctx_var


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware for injecting Request IDs and measuring response latency."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Extract existing or generate new request ID
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_ctx_var.set(req_id)

        start_time = time.perf_counter()
        logger.debug(f"--> {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            process_time = (time.perf_counter() - start_time) * 1000  # ms
            
            # Attach tracking headers
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

            # Log completion
            status_code = response.status_code
            logger.info(
                f"<-- {request.method} {request.url.path} {status_code} in {process_time:.2f}ms"
            )
            return response
        except Exception as exc:
            process_time = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"<-- {request.method} {request.url.path} 500 error in {process_time:.2f}ms: {exc}"
            )
            raise
        finally:
            request_id_ctx_var.reset(token)
