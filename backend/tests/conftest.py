"""
Pytest fixtures shared across all test files.

Provides:
  - app:         A Flask app configured for testing (in-memory SQLite).
  - client:      A Flask test client for making HTTP requests.
  - db_session:  A database session that rolls back after each test.
  - auth_header: A helper to generate an Authorization header for a user.
  - seed_data:   Pre-populated users and leave requests for integration tests.

NOTE: seed_data returns plain dicts with IDs and scalar values, NOT SQLAlchemy
model objects. This avoids DetachedInstanceError when accessing attributes
outside the session that created them.
"""

import pytest
from datetime import date, timedelta, datetime, timezone
from app import create_app, db as _db
from app.models import User, LeaveRequest, AuditLog
from app.services.auth_service import generate_token


@pytest.fixture
def app():
    """Create a Flask app with testing config (in-memory SQLite)."""
    app = create_app('testing')
    yield app


@pytest.fixture
def client(app):
    """Flask test client for making HTTP requests to the app."""
    return app.test_client()


@pytest.fixture(autouse=True)
def db_session(app):
    """
    Create fresh database tables before each test, drop them after.
    This ensures every test starts with a clean database.
    """
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


def make_auth_header(app, user_id, role):
    """Helper: create an Authorization header with a valid JWT token."""
    token = generate_token(
        user_id=user_id,
        role=role,
        secret_key=app.config['SECRET_KEY']
    )
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def seed_data(app, db_session):
    """
    Populate the test database with a manager, employees, and some leave requests.
    Returns a dict of plain values (IDs, balances, etc.) — NOT model objects —
    to avoid SQLAlchemy DetachedInstanceError.
    """
    with app.app_context():
        # Create a manager
        manager = User(
            name='Test Manager',
            email='manager@test.com',
            role='manager',
            leave_balance=20,
            avatar_color='#7C3AED',
        )
        manager.set_password('password123')
        _db.session.add(manager)
        _db.session.flush()

        # Create a second manager (for cross-team tests)
        manager2 = User(
            name='Other Manager',
            email='manager2@test.com',
            role='manager',
            leave_balance=20,
            avatar_color='#0891B2',
        )
        manager2.set_password('password123')
        _db.session.add(manager2)
        _db.session.flush()

        # Create employees reporting to manager
        emp1 = User(
            name='Test Employee 1',
            email='emp1@test.com',
            role='employee',
            manager_id=manager.id,
            leave_balance=15,
            avatar_color='#4F46E5',
        )
        emp1.set_password('password123')

        emp2 = User(
            name='Test Employee 2',
            email='emp2@test.com',
            role='employee',
            manager_id=manager.id,
            leave_balance=3,  # Low balance for testing
            avatar_color='#059669',
        )
        emp2.set_password('password123')

        # Employee reporting to manager2 (different team)
        emp3 = User(
            name='Other Team Employee',
            email='emp3@test.com',
            role='employee',
            manager_id=manager2.id,
            leave_balance=20,
            avatar_color='#D97706',
        )
        emp3.set_password('password123')

        _db.session.add_all([emp1, emp2, emp3])
        _db.session.flush()

        # Create an existing approved leave for emp1 (for overlap testing)
        today = date.today()
        existing_leave = LeaveRequest(
            employee_id=emp1.id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
            reason='Existing approved leave',
            status='approved',
        )
        _db.session.add(existing_leave)
        _db.session.flush()

        # Audit log for the existing leave
        _db.session.add(AuditLog(
            leave_request_id=existing_leave.id,
            action='created',
            performed_by=emp1.id,
            note='Leave request submitted',
        ))
        _db.session.add(AuditLog(
            leave_request_id=existing_leave.id,
            action='approved',
            performed_by=manager.id,
            note='Approved by Test Manager',
        ))

        # Create a pending leave for emp1 (for approve/reject/cancel tests)
        pending_leave = LeaveRequest(
            employee_id=emp1.id,
            start_date=today + timedelta(days=30),
            end_date=today + timedelta(days=32),
            reason='Pending leave for testing',
            status='pending',
        )
        _db.session.add(pending_leave)
        _db.session.flush()

        _db.session.add(AuditLog(
            leave_request_id=pending_leave.id,
            action='created',
            performed_by=emp1.id,
            note='Leave request submitted',
        ))

        _db.session.commit()

        # Return plain dicts with scalar values to avoid DetachedInstanceError
        return {
            'manager_id': manager.id,
            'manager_role': 'manager',
            'manager2_id': manager2.id,
            'manager2_role': 'manager',
            'emp1_id': emp1.id,
            'emp1_role': 'employee',
            'emp1_balance': 15,
            'emp2_id': emp2.id,
            'emp2_role': 'employee',
            'emp2_balance': 3,
            'emp3_id': emp3.id,
            'emp3_role': 'employee',
            'existing_leave_id': existing_leave.id,
            'pending_leave_id': pending_leave.id,
        }
