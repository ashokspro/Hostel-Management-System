# tests/test_gatepass.py

import pytest
from httpx import AsyncClient
from datetime import date, timedelta



# ── Shared test data ──────────────────────────────────────────
# tomorrow's date — so "departure cannot be in past" check passes
TOMORROW = (date.today() + timedelta(days=1)).isoformat()
DAY_AFTER = (date.today() + timedelta(days=2)).isoformat()

# Add this to test_auth.py, test_users.py, test_gatepass.py
def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

class TestGatePass:

    
    async def test_create_gatepass(
        self, client: AsyncClient, student_token: str
    ):
        """Student can create a gate pass request."""
        response = await client.post(
            "/api/student/gatepasses",
            headers=auth_headers(student_token),
            json={
                "reason": "Going home for festival",
                "going_place": "Chennai",
                "out_date": TOMORROW,
                "out_time": "10:00:00",
                "return_date": DAY_AFTER,
                "return_time": "18:00:00"
            }
        )
        assert response.status_code == 201

        data = response.json()
        assert data["status"] == "Pending"
        assert data["exit_status"] == "In"
        assert data["student_id"] == "STU001"
        assert data["pass_number"].startswith("GP-")

        # Store pass_id for use in later tests
        # pytest doesn't share state between tests by default
        # so we use a class variable
        TestGatePass.pass_id = data["pass_id"]

    async def test_create_second_gatepass_blocked(
        self, client: AsyncClient, student_token: str
    ):
        """
        Student cannot create a second gate pass
        while first is still Pending/Approved.
        """
        response = await client.post(
            "/api/student/gatepasses",
            headers=auth_headers(student_token),
            json={
                "reason": "Another request",
                "going_place": "Bangalore",
                "out_date": TOMORROW,
                "out_time": "09:00:00",
                "return_date": DAY_AFTER,
                "return_time": "17:00:00"
            }
        )
        assert response.status_code == 400
        assert "active gate pass" in response.json()["detail"]

    async def test_view_my_gatepasses(
        self, client: AsyncClient, student_token: str
    ):
        """Student can view their own gate passes."""
        response = await client.get(
            "/api/student/gatepasses",
            headers=auth_headers(student_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_warden_sees_pending(
        self, client: AsyncClient, warden_token: str
    ):
        """Warden can see pending gate passes."""
        response = await client.get(
            "/api/warden/gatepasses/pending",
            headers=auth_headers(warden_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned passes must be Pending
        for gp in data:
            assert gp["status"] == "Pending"

    async def test_approve_gatepass(
        self, client: AsyncClient, warden_token: str
    ):
        """Warden can approve a pending gate pass."""
        response = await client.put(
            f"/api/warden/gatepasses/{TestGatePass.pass_id}/approve",
            headers=auth_headers(warden_token),
            json={"remarks": "Approved for festival leave"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Approved"
        assert data["approved_by_id"] == "WARDEN001"

    async def test_approve_already_approved_blocked(
        self, client: AsyncClient, warden_token: str
    ):
        """Cannot approve an already approved pass → 400."""
        response = await client.put(
            f"/api/warden/gatepasses/{TestGatePass.pass_id}/approve",
            headers=auth_headers(warden_token),
            json={"remarks": "Trying again"}
        )
        assert response.status_code == 400
        assert "PENDING" in response.json()["detail"]

    async def test_mark_return_before_exit_blocked(
        self, client: AsyncClient, security_token: str
    ):
        """
        Security cannot mark return before exit → 400.
        Student hasn't exited yet at this point.
        """
        response = await client.put(
            f"/api/security/gatepasses/{TestGatePass.pass_id}/return",
            headers=auth_headers(security_token),
            json={"security_remarks": "Trying to return before exit"}
        )
        assert response.status_code == 400
        assert "not exited" in response.json()["detail"]

    async def test_mark_exit(
        self, client: AsyncClient, security_token: str
    ):
        """Security can mark approved student as exited."""
        response = await client.put(
            f"/api/security/gatepasses/{TestGatePass.pass_id}/exit",
            headers=auth_headers(security_token),
            json={"security_remarks": "Student exited main gate"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["exit_status"] == "Out"
        assert data["actual_out_time"] is not None

    async def test_mark_exit_twice_blocked(
        self, client: AsyncClient, security_token: str
    ):
        """Cannot mark exit twice → 400."""
        response = await client.put(
            f"/api/security/gatepasses/{TestGatePass.pass_id}/exit",
            headers=auth_headers(security_token),
            json={"security_remarks": "Trying again"}
        )
        assert response.status_code == 400
        assert "already exited" in response.json()["detail"]

    async def test_mark_return(
        self, client: AsyncClient, security_token: str
    ):
        """Security can mark student as returned."""
        response = await client.put(
            f"/api/security/gatepasses/{TestGatePass.pass_id}/return",
            headers=auth_headers(security_token),
            json={"security_remarks": "Student returned on time"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["exit_status"] == "In"
        assert data["actual_return_time"] is not None

    async def test_download_pdf(
        self, client: AsyncClient, student_token: str
    ):
        """
        PDF download should return 200 with
        application/pdf content type.
        """
        response = await client.get(
            f"/api/gatepasses/{TestGatePass.pass_id}/download",
            headers=auth_headers(student_token)
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

    async def test_past_date_rejected(
        self, client: AsyncClient, student_token: str
    ):
        """Gate pass with past departure date → 422."""
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        response = await client.post(
            "/api/student/gatepasses",
            headers=auth_headers(student_token),
            json={
                "reason": "Late request",
                "going_place": "Chennai",
                "out_date": yesterday,      # past date
                "out_time": "10:00:00",
                "return_date": yesterday,
                "return_time": "18:00:00"
            }
        )
        assert response.status_code == 422
