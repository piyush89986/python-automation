import uuid
import pytest


@pytest.mark.asyncio
async def test_super_admin_create_business(client, super_admin_token):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    payload = {
        "name": "Stark Industries",
        "slug": "stark-industries",
        "plan_tier": "pro",
        "max_bots": 10,
        "max_messages_per_month": 50000,
        "max_documents": 100,
        "admin_email": "tony@stark.com",
        "admin_password": "AvengersAssemble2024!",
        "admin_full_name": "Tony Stark",
    }
    response = await client.post("/api/v1/businesses", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["name"] == "Stark Industries"
    assert data["data"]["slug"] == "stark-industries"
    assert data["data"]["plan_tier"] == "pro"
    assert data["data"]["max_bots"] == 10

    # Test login with the newly created client admin credentials!
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "tony@stark.com", "password": "AvengersAssemble2024!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()["data"]
    assert login_data["user"]["role"] == "business_admin"
    assert login_data["user"]["business_id"] == data["data"]["id"]


@pytest.mark.asyncio
async def test_duplicate_slug_or_email_conflict(client, super_admin_token, test_business, business_admin):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    # Duplicate slug
    payload_slug = {
        "name": "Duplicate Acme",
        "slug": "acme-corp",
        "admin_email": "unique@acme.com",
        "admin_password": "Password123!",
        "admin_full_name": "Unique Name",
    }
    res_slug = await client.post("/api/v1/businesses", json=payload_slug, headers=headers)
    assert res_slug.status_code == 409
    assert res_slug.json()["error"]["code"] == "CONFLICT"

    # Duplicate admin email
    payload_email = {
        "name": "Different Name",
        "slug": "different-slug",
        "admin_email": "admin@acme.com",
        "admin_password": "Password123!",
        "admin_full_name": "Different Name",
    }
    res_email = await client.post("/api/v1/businesses", json=payload_email, headers=headers)
    assert res_email.status_code == 409


@pytest.mark.asyncio
async def test_rbac_business_admin_cannot_create_business(client, business_admin_token):
    headers = {"Authorization": f"Bearer {business_admin_token}"}
    payload = {
        "name": "Illegal Org",
        "admin_email": "illegal@org.com",
        "admin_password": "Password123!",
        "admin_full_name": "Illegal User",
    }
    response = await client.post("/api/v1/businesses", json=payload, headers=headers)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_list_businesses(client, super_admin_token, test_business):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await client.get("/api/v1/businesses?page=1&limit=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["data"]) >= 1
    assert data["pagination"]["total"] >= 1


@pytest.mark.asyncio
async def test_tenant_isolation_get_business(client, business_admin_token, test_business):
    headers = {"Authorization": f"Bearer {business_admin_token}"}

    # Own business access: SUCCESS
    res_own = await client.get(f"/api/v1/businesses/{test_business.id}", headers=headers)
    assert res_own.status_code == 200
    assert res_own.json()["data"]["name"] == "Acme Corporation"

    # Cross-tenant access: FORBIDDEN
    random_biz_id = uuid.uuid4()
    res_other = await client.get(f"/api/v1/businesses/{random_biz_id}", headers=headers)
    assert res_other.status_code == 403
    assert res_other.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_get_business_usage(client, business_admin_token, test_business):
    headers = {"Authorization": f"Bearer {business_admin_token}"}
    response = await client.get(f"/api/v1/businesses/{test_business.id}/usage", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["business_id"] == str(test_business.id)
    assert data["plan_tier"] == "starter"
    assert data["messages_limit"] == 10000
    assert data["messages_used"] == 150


@pytest.mark.asyncio
async def test_super_admin_update_and_deactivate_business(client, super_admin_token, test_business):
    headers = {"Authorization": f"Bearer {super_admin_token}"}

    # Update plan to PRO
    update_payload = {"plan_tier": "pro", "name": "Acme Global Industries"}
    update_res = await client.patch(
        f"/api/v1/businesses/{test_business.id}",
        json=update_payload,
        headers=headers,
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()["data"]
    assert updated_data["plan_tier"] == "pro"
    assert updated_data["name"] == "Acme Global Industries"
    assert updated_data["max_bots"] == 10  # default for PRO

    # Deactivate business
    delete_res = await client.delete(f"/api/v1/businesses/{test_business.id}", headers=headers)
    assert delete_res.status_code == 200
    assert delete_res.json()["data"]["is_active"] is False
