import pytest
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.errors import UnauthorizedError


def test_password_hashing():
    raw = "MySecretPassword123!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_flow():
    payload = {"sub": "user-uuid-123", "role": "super_admin"}
    access = create_access_token(payload)
    decoded_access = decode_token(access, is_refresh=False)
    assert decoded_access["sub"] == "user-uuid-123"
    assert decoded_access["role"] == "super_admin"
    assert decoded_access["type"] == "access"

    refresh = create_refresh_token({"sub": "user-uuid-123"})
    decoded_refresh = decode_token(refresh, is_refresh=True)
    assert decoded_refresh["sub"] == "user-uuid-123"
    assert decoded_refresh["type"] == "refresh"

    # Cross-type rejection
    with pytest.raises(UnauthorizedError):
        decode_token(access, is_refresh=True)


@pytest.mark.asyncio
async def test_login_success(client, super_admin):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@test.com", "password": "SuperAdmin123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["email"] == "superadmin@test.com"
    assert data["data"]["user"]["role"] == "super_admin"


@pytest.mark.asyncio
async def test_login_invalid_password(client, super_admin):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@test.com", "password": "IncorrectPassword"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_refresh_token_endpoint(client, super_admin):
    refresh_token = create_refresh_token({"sub": str(super_admin.id)})
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == super_admin.email


@pytest.mark.asyncio
async def test_get_me_endpoint(client, business_admin, business_admin_token):
    headers = {"Authorization": f"Bearer {business_admin_token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["user"]["email"] == "admin@acme.com"
    assert data["data"]["user"]["role"] == "business_admin"
    assert data["data"]["business"]["name"] == "Acme Corporation"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
