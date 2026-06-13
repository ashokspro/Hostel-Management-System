# tests/test_users.py

import pytest
from httpx import AsyncClient

def auth_headers(token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}

class TestUsers:
    
    async def test_get_student_profile(
        self, client: AsyncClient, student_token: str
    ):
        """Student can view their own profile."""
        response = await client.get(
            "/api/student/profile",
            headers=auth_headers(student_token)
        )
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == "STU001"
        assert data["name"] == "Test Student"
        assert data["user_type"] == "student"
        # Password hash must NEVER appear in response
        assert "password_hash" not in data
        assert "password" not in data

    async def test_update_student_profile(
        self, client: AsyncClient, student_token: str
    ):
        """Student can update their own profile."""
        response = await client.put(
            "/api/student/profile",
            headers=auth_headers(student_token),
            json={"phone": "8888888888"}
        )
        assert response.status_code == 200
        assert response.json()["phone"] == "8888888888"

    async def test_create_user_as_warden(
        self, client: AsyncClient, warden_token: str
    ):
        """Warden can create a new student."""
        response = await client.post(
            "/api/admin/users",
            headers=auth_headers(warden_token),
            json={
                "id": "STU_TEST01",
                "name": "New Test Student",
                "password": "Test@1234",
                "user_type": "student",
                "email": "newstudent@test.com",
                "room": "202",
                "course": "Physics",
                "year": "1st Year",
                "guardian_name": "Guardian Name",
                "guardian_phone": "7777777777"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "STU_TEST01"
        assert data["user_type"] == "student"
        assert "password_hash" not in data

    async def test_create_duplicate_user(
        self, client: AsyncClient, warden_token: str
    ):
        """Creating user with existing ID → 400."""
        response = await client.post(
            "/api/admin/users",
            headers=auth_headers(warden_token),
            json={
                "id": "STU001",     # already exists
                "name": "Duplicate",
                "password": "Test@1234",
                "user_type": "student"
            }
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    async def test_create_user_as_student_forbidden(
        self, client: AsyncClient, student_token: str
    ):
        """Student cannot create users → 403."""
        response = await client.post(
            "/api/admin/users",
            headers=auth_headers(student_token),
            json={
                "id": "STU999",
                "name": "Unauthorized",
                "password": "Test@1234",
                "user_type": "student"
            }
        )
        assert response.status_code == 403

    async def test_list_students_as_warden(
        self, client: AsyncClient, warden_token: str
    ):
        """Warden can list all students."""
        response = await client.get(
            "/api/warden/students",
            headers=auth_headers(warden_token)
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_deactivate_user(
        self, client: AsyncClient, warden_token: str
    ):
        """Warden can deactivate a user."""
        response = await client.put(
            "/api/admin/users/STU_TEST01/deactivate",
            headers=auth_headers(warden_token)
        )
        assert response.status_code == 200
        assert response.json()["is_active"] == False

    async def test_activate_user(
        self, client: AsyncClient, warden_token: str
    ):
        """Warden can reactivate a deactivated user."""
        response = await client.put(
            "/api/admin/users/STU_TEST01/activate",
            headers=auth_headers(warden_token)
        )
        assert response.status_code == 200
        assert response.json()["is_active"] == True

    async def test_weak_password_rejected(
        self, client: AsyncClient, warden_token: str
    ):
        """
        Weak password should be rejected by Pydantic validator → 422.
        "password" has no uppercase, number, or special char.
        """
        response = await client.post(
            "/api/admin/users",
            headers=auth_headers(warden_token),
            json={
                "id": "STU_WEAK",
                "name": "Weak Pass Student",
                "password": "weakpass",   # fails validator
                "user_type": "student"
            }
        )
        assert response.status_code == 422