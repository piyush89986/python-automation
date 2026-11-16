import pytest
from unittest.mock import patch


@pytest.mark.asyncio
async def test_root_endpoint(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Multi-Tenant AI Chatbot Backend" in data["app"]


@pytest.mark.asyncio
async def test_health_endpoint_healthy(client):
    with patch("app.api.v1.endpoints.health.check_database_connection", return_value=True), \
         patch("app.api.v1.endpoints.health.check_redis_connection", return_value=True):
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["services"]["database"]["status"] == "healthy"
        assert data["services"]["redis"]["status"] == "healthy"
        assert "X-Request-ID" in response.headers
        assert "X-Process-Time" in response.headers


@pytest.mark.asyncio
async def test_health_endpoint_degraded(client):
    with patch("app.api.v1.endpoints.health.check_database_connection", return_value=False), \
         patch("app.api.v1.endpoints.health.check_redis_connection", return_value=False):
        response = await client.get("/health")
        # In development mode, returns 200 with status='degraded'
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["database"]["status"] == "unhealthy"
        assert data["services"]["redis"]["status"] == "unhealthy"


@pytest.mark.asyncio
async def test_not_found_handling(client):
    response = await client.get("/non_existent_route_404")
    assert response.status_code == 404
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "HTTP_EXCEPTION"
