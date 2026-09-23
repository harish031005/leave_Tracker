"""
Integration tests for the REST API endpoints.

These tests use the Flask test client to make actual HTTP requests,
hitting the real route handlers, service layer, and database (in-memory SQLite).
They verify the full request → response cycle including status codes, JSON bodies,
and database side effects (balance deduction, status changes, etc.).

NOTE: seed_data returns plain dicts with IDs (not model objects) to avoid
SQLAlchemy DetachedInstanceError.
"""

import pytest
import json
from datetime import date, timedelta
from tests.conftest import make_auth_header


# ===================================================================
# Auth Tests
# ===================================================================

class TestAuthAPI:
    """Tests for POST /api/auth/login and GET /api/auth/users."""

    def test_login_success(self, client, app, seed_data):
        """Valid credentials should return a token and user info."""
        response = client.post('/api/auth/login', json={
            'email': 'emp1@test.com',
            'password': 'password123',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert data['user']['email'] == 'emp1@test.com'
        assert data['user']['role'] == 'employee'

    def test_login_wrong_password(self, client, app, seed_data):
        """Wrong password should return 401."""
        response = client.post('/api/auth/login', json={
            'email': 'emp1@test.com',
            'password': 'wrongpassword',
        })
        assert response.status_code == 401

    def test_login_unknown_email(self, client, app, seed_data):
        """Unknown email should return 401."""
        response = client.post('/api/auth/login', json={
            'email': 'nobody@test.com',
            'password': 'password123',
        })
        assert response.status_code == 401

    def test_login_missing_fields(self, client, app):
        """Missing email/password should return 400."""
        response = client.post('/api/auth/login', json={})
        assert response.status_code == 400

    def test_list_users(self, client, app, seed_data):
        """GET /api/auth/users should return all users."""
        response = client.get('/api/auth/users')
        assert response.status_code == 200
        users = response.get_json()
        assert len(users) == 5  # 2 managers + 3 employees


# ===================================================================
# Employee Tests
# ===================================================================

class TestEmployeeAPI:
    """Tests for /api/employees endpoints."""

    def test_get_current_user(self, client, app, seed_data):
        """GET /api/employees/me should return the authenticated user's profile."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        response = client.get('/api/employees/me', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['name'] == 'Test Employee 1'

    def test_get_balance(self, client, app, seed_data):
        """GET /api/employees/<id>/balance should return the user's leave balance."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        response = client.get(
            f'/api/employees/{seed_data["emp1_id"]}/balance',
            headers=headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['leave_balance'] == 15

    def test_unauthorized_without_token(self, client, app, seed_data):
        """Requests without a token should return 401."""
        response = client.get('/api/employees/me')
        assert response.status_code == 401


# ===================================================================
# Leave Request Creation Tests
# ===================================================================

class TestCreateLeaveRequest:
    """Tests for POST /api/leave-requests."""

    def test_create_valid_request(self, client, app, seed_data):
        """A valid request should return 201 with pending status."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        today = date.today()
        response = client.post('/api/leave-requests', headers=headers, json={
            'start_date': (today + timedelta(days=50)).isoformat(),
            'end_date': (today + timedelta(days=52)).isoformat(),
            'reason': 'Test vacation',
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data['status'] == 'pending'
        assert data['reason'] == 'Test vacation'

    def test_invalid_date_range(self, client, app, seed_data):
        """End date before start date should return 400."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        today = date.today()
        response = client.post('/api/leave-requests', headers=headers, json={
            'start_date': (today + timedelta(days=55)).isoformat(),
            'end_date': (today + timedelta(days=50)).isoformat(),
            'reason': 'Test',
        })
        assert response.status_code == 400
        assert 'End date' in response.get_json()['error']

    def test_overlapping_request(self, client, app, seed_data):
        """Overlapping with existing leave should return 400."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        today = date.today()
        # emp1 has approved leave from today+10 to today+12
        response = client.post('/api/leave-requests', headers=headers, json={
            'start_date': (today + timedelta(days=11)).isoformat(),
            'end_date': (today + timedelta(days=13)).isoformat(),
            'reason': 'Overlapping request',
        })
        assert response.status_code == 400
        assert 'overlap' in response.get_json()['error'].lower()

    def test_insufficient_balance(self, client, app, seed_data):
        """Requesting more days than balance should return 400."""
        headers = make_auth_header(app, seed_data['emp2_id'], 'employee')
        today = date.today()
        # emp2 has only 3 days balance
        response = client.post('/api/leave-requests', headers=headers, json={
            'start_date': (today + timedelta(days=50)).isoformat(),
            'end_date': (today + timedelta(days=60)).isoformat(),
            'reason': 'Long vacation',
        })
        assert response.status_code == 400
        assert 'Insufficient' in response.get_json()['error']

    def test_missing_reason(self, client, app, seed_data):
        """Missing reason should return 400."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        today = date.today()
        response = client.post('/api/leave-requests', headers=headers, json={
            'start_date': (today + timedelta(days=50)).isoformat(),
            'end_date': (today + timedelta(days=52)).isoformat(),
            'reason': '',
        })
        assert response.status_code == 400


# ===================================================================
# Leave Request Approval/Rejection Tests
# ===================================================================

class TestApproveReject:
    """Tests for PUT /api/leave-requests/<id>/approve and /reject."""

    def test_manager_approves_own_team(self, client, app, seed_data):
        """Manager should be able to approve a pending request from their team."""
        headers = make_auth_header(app, seed_data['manager_id'], 'manager')
        request_id = seed_data['pending_leave_id']
        response = client.put(
            f'/api/leave-requests/{request_id}/approve',
            headers=headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'approved'

    def test_approval_deducts_balance(self, client, app, seed_data):
        """Approving should deduct the leave balance."""
        headers = make_auth_header(app, seed_data['manager_id'], 'manager')
        request_id = seed_data['pending_leave_id']
        emp_id = seed_data['emp1_id']
        original_balance = seed_data['emp1_balance']

        # Approve the request
        client.put(f'/api/leave-requests/{request_id}/approve', headers=headers)

        # Check balance was deducted
        emp_headers = make_auth_header(app, emp_id, 'employee')
        response = client.get(f'/api/employees/{emp_id}/balance', headers=emp_headers)
        new_balance = response.get_json()['leave_balance']

        # pending_leave is 3 days (today+30 to today+32)
        assert new_balance == original_balance - 3

    def test_manager_rejects(self, client, app, seed_data):
        """Manager should be able to reject a pending request."""
        headers = make_auth_header(app, seed_data['manager_id'], 'manager')
        request_id = seed_data['pending_leave_id']
        response = client.put(
            f'/api/leave-requests/{request_id}/reject',
            headers=headers
        )
        assert response.status_code == 200
        assert response.get_json()['status'] == 'rejected'

    def test_rejection_does_not_deduct_balance(self, client, app, seed_data):
        """Rejecting should NOT change the leave balance."""
        headers = make_auth_header(app, seed_data['manager_id'], 'manager')
        request_id = seed_data['pending_leave_id']
        emp_id = seed_data['emp1_id']
        original_balance = seed_data['emp1_balance']

        # Reject the request
        client.put(f'/api/leave-requests/{request_id}/reject', headers=headers)

        # Balance should be unchanged
        emp_headers = make_auth_header(app, emp_id, 'employee')
        response = client.get(f'/api/employees/{emp_id}/balance', headers=emp_headers)
        assert response.get_json()['leave_balance'] == original_balance

    def test_wrong_manager_cannot_approve(self, client, app, seed_data):
        """A manager from a different team should get 403."""
        headers = make_auth_header(app, seed_data['manager2_id'], 'manager')
        request_id = seed_data['pending_leave_id']
        response = client.put(
            f'/api/leave-requests/{request_id}/approve',
            headers=headers
        )
        assert response.status_code == 403

    def test_employee_cannot_approve(self, client, app, seed_data):
        """An employee should get 403 when trying to approve."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        request_id = seed_data['pending_leave_id']
        response = client.put(
            f'/api/leave-requests/{request_id}/approve',
            headers=headers
        )
        assert response.status_code == 403

    def test_approve_nonexistent_request(self, client, app, seed_data):
        """Approving a non-existent request should return 404."""
        headers = make_auth_header(app, seed_data['manager_id'], 'manager')
        response = client.put('/api/leave-requests/9999/approve', headers=headers)
        assert response.status_code == 404


# ===================================================================
# Leave Request Cancellation Tests
# ===================================================================

class TestCancelRequest:
    """Tests for PUT /api/leave-requests/<id>/cancel."""

    def test_employee_cancels_pending(self, client, app, seed_data):
        """Employee should be able to cancel their own pending request."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        request_id = seed_data['pending_leave_id']
        response = client.put(
            f'/api/leave-requests/{request_id}/cancel',
            headers=headers
        )
        assert response.status_code == 200
        assert response.get_json()['status'] == 'cancelled'

    def test_cannot_cancel_approved(self, client, app, seed_data):
        """Should not be able to cancel an approved request."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        # existing_leave is already approved
        request_id = seed_data['existing_leave_id']
        response = client.put(
            f'/api/leave-requests/{request_id}/cancel',
            headers=headers
        )
        assert response.status_code == 400

    def test_other_employee_cannot_cancel(self, client, app, seed_data):
        """A different employee should not be able to cancel someone else's request."""
        headers = make_auth_header(app, seed_data['emp2_id'], 'employee')
        request_id = seed_data['pending_leave_id']  # belongs to emp1
        response = client.put(
            f'/api/leave-requests/{request_id}/cancel',
            headers=headers
        )
        assert response.status_code == 403


# ===================================================================
# List & Detail Tests
# ===================================================================

class TestListAndDetail:
    """Tests for GET /api/leave-requests."""

    def test_list_all_requests(self, client, app, seed_data):
        """Should return all leave requests."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        response = client.get('/api/leave-requests', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) >= 2  # At least the seeded requests

    def test_filter_by_employee(self, client, app, seed_data):
        """Should filter by employee_id."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        emp_id = seed_data['emp1_id']
        response = client.get(
            f'/api/leave-requests?employee_id={emp_id}',
            headers=headers
        )
        assert response.status_code == 200
        for req in response.get_json():
            assert req['employee_id'] == emp_id

    def test_filter_by_status(self, client, app, seed_data):
        """Should filter by status."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        response = client.get('/api/leave-requests?status=pending', headers=headers)
        assert response.status_code == 200
        for req in response.get_json():
            assert req['status'] == 'pending'

    def test_get_request_detail(self, client, app, seed_data):
        """GET /api/leave-requests/<id> should return full detail with audit trail."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        request_id = seed_data['existing_leave_id']
        response = client.get(
            f'/api/leave-requests/{request_id}',
            headers=headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'audit_trail' in data
        assert len(data['audit_trail']) >= 1


# ===================================================================
# Team Calendar Tests
# ===================================================================

class TestTeamCalendar:
    """Tests for GET /api/team/calendar."""

    def test_manager_sees_team_calendar(self, client, app, seed_data):
        """Manager should see approved leave for their team."""
        headers = make_auth_header(app, seed_data['manager_id'], 'manager')
        response = client.get('/api/team/calendar', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        # Should contain the approved leave for emp1
        assert len(data) >= 1
        for entry in data:
            assert entry['status'] == 'approved'

    def test_employee_cannot_see_calendar(self, client, app, seed_data):
        """Employees should get 403 for team calendar."""
        headers = make_auth_header(app, seed_data['emp1_id'], 'employee')
        response = client.get('/api/team/calendar', headers=headers)
        assert response.status_code == 403
