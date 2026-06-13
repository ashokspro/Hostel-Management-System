# tests/test_auth.py

import pytest
from httpx import AsyncClient

# Add this to test_auth.py, test_users.py, test_gatepass.py
def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
    


class TestAuth:
    """
    Tests for authentication endpoints.
    
    Each method is one test case.
    pytest discovers methods starting with "test_"
    """
    
    async def test_login_success_warden(self, client: AsyncClient):
        """
        Valid warden login should return 200
        with access_token, user_type, and id.
        """
        response = await client.post("/api/auth/login", json={
            "id": "WARDEN001",
            "password": "Warden@123"
        })
        assert response.status_code == 200

        data = response.json()
        # Token must exist and not be empty
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        assert data["token_type"] == "bearer"
        assert data["user_type"] == "warden"
        assert data["id"] == "WARDEN001"

    async def test_login_success_student(self, client: AsyncClient):
        """Valid student login should return 200."""
        response = await client.post("/api/auth/login", json={
            "id": "STU001",
            "password": "Student@123"
        })
        assert response.status_code == 200
        assert response.json()["user_type"] == "student"

    async def test_login_success_security(self, client: AsyncClient):
        """Valid security login should return 200."""
        response = await client.post("/api/auth/login", json={
            "id": "SEC001",
            "password": "Security@123"
        })
        assert response.status_code == 200
        assert response.json()["user_type"] == "security"

    async def test_login_wrong_password(self, client: AsyncClient):
        """
        Wrong password should return 401.
        Error message should NOT reveal whether ID or password is wrong
        — saying "Invalid credentials" for both is the secure approach.
        """
        response = await client.post("/api/auth/login", json={
            "id": "WARDEN001",
            "password": "WrongPassword@123"
        })
        assert response.status_code == 401
        assert "detail" in response.json()
        assert response.json()["detail"] == "Invalid credentials"

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Non-existent user ID should return 401."""
        response = await client.post("/api/auth/login", json={
            "id": "NOBODY999",
            "password": "Whatever@123"
        })
        assert response.status_code == 401

    async def test_login_missing_fields(self, client: AsyncClient):
        """
        Missing required fields should return 422.
        422 = Unprocessable Entity — Pydantic validation failed.
        """
        response = await client.post("/api/auth/login", json={
            "id": "WARDEN001"
            # password missing
        })
        assert response.status_code == 422

    async def test_protected_route_without_token(self, client: AsyncClient):
        """
        Accessing protected route without token → 401.
        OAuth2 always returns 401 for missing token.
        """
        response = await client.get("/api/student/profile")
        assert response.status_code == 401

    async def test_protected_route_with_invalid_token(self, client: AsyncClient):
        """Invalid/expired token should return 401."""
        response = await client.get(
            "/api/student/profile",
            headers={"Authorization": "Bearer invalidtoken123"}
        )
        assert response.status_code == 401

    async def test_warden_cannot_access_student_route(
        self, client: AsyncClient, warden_token: str
    ):
        """
        Role guard test — warden token on student-only route → 403.
        403 = Forbidden — authenticated but wrong role.
        """
        response = await client.get(
            "/api/student/profile",
            headers=auth_headers(warden_token)
        )
        assert response.status_code == 403

    async def test_student_cannot_access_warden_route(
        self, client: AsyncClient, student_token: str
    ):
        """Student token on warden-only route → 403."""
        response = await client.get(
            "/api/warden/students",
            headers=auth_headers(student_token)
        )
        assert response.status_code == 403