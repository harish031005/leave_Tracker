"""
Database seeder — populates the database with realistic sample data.

Creates:
  - 2 managers
  - 8 employees (4 per manager)
  - A mix of pending, approved, rejected, and cancelled leave requests
  - Audit log entries for every status change

Run this once on first startup so the UI looks populated immediately.
All demo users have the password: 'password123'
"""

import logging
from datetime import date, datetime, timedelta, timezone
from app import db
from app.models import User, LeaveRequest, AuditLog

logger = logging.getLogger('leavetrack')


def seed_database():
    """
    Populate the database with sample data if no users exist yet.
    Skips seeding if data already exists (safe to call on every startup).
    """
    # Don't re-seed if users already exist
    if User.query.first() is not None:
        logger.info("Database already seeded — skipping.")
        return

    logger.info("Seeding database with sample data...")

    # ------------------------------------------------------------------
    # 1. Create Managers
    # ------------------------------------------------------------------
    manager1 = User(
        name='Sarah Chen',
        email='sarah.chen@leavetrack.com',
        role='manager',
        leave_balance=20,
        avatar_color='#7C3AED',  # Purple
    )
    manager1.set_password('password123')

    manager2 = User(
        name='James Wilson',
        email='james.wilson@leavetrack.com',
        role='manager',
        leave_balance=20,
        avatar_color='#0891B2',  # Teal
    )
    manager2.set_password('password123')

    db.session.add_all([manager1, manager2])
    db.session.flush()  # Get IDs before creating employees

    # ------------------------------------------------------------------
    # 2. Create Employees (4 per manager)
    # ------------------------------------------------------------------
    employees_data = [
        # Team 1 — reports to Sarah Chen
        {'name': 'Alice Johnson',   'email': 'alice.johnson@leavetrack.com',   'manager': manager1, 'balance': 15, 'color': '#4F46E5'},
        {'name': 'Bob Martinez',    'email': 'bob.martinez@leavetrack.com',    'manager': manager1, 'balance': 18, 'color': '#059669'},
        {'name': 'Carol Williams',  'email': 'carol.williams@leavetrack.com',  'manager': manager1, 'balance': 8,  'color': '#D97706'},
        {'name': 'David Kim',       'email': 'david.kim@leavetrack.com',       'manager': manager1, 'balance': 20, 'color': '#DC2626'},
        # Team 2 — reports to James Wilson
        {'name': 'Emily Davis',     'email': 'emily.davis@leavetrack.com',     'manager': manager2, 'balance': 12, 'color': '#2563EB'},
        {'name': 'Frank Brown',     'email': 'frank.brown@leavetrack.com',     'manager': manager2, 'balance': 5,  'color': '#9333EA'},
        {'name': 'Grace Lee',       'email': 'grace.lee@leavetrack.com',       'manager': manager2, 'balance': 17, 'color': '#0D9488'},
        {'name': 'Henry Taylor',    'email': 'henry.taylor@leavetrack.com',    'manager': manager2, 'balance': 20, 'color': '#EA580C'},
    ]

    employees = []
    for emp_data in employees_data:
        emp = User(
            name=emp_data['name'],
            email=emp_data['email'],
            role='employee',
            manager_id=emp_data['manager'].id,
            leave_balance=emp_data['balance'],
            avatar_color=emp_data['color'],
        )
        emp.set_password('password123')
        employees.append(emp)

    db.session.add_all(employees)
    db.session.flush()

    # ------------------------------------------------------------------
    # 3. Create Leave Requests (mix of statuses)
    # ------------------------------------------------------------------
    today = date.today()

    # Helper to create a request + audit log in one step
    def create_leave(employee, start, end, reason, status, reviewer=None):
        """Create a leave request with appropriate audit entries."""
        lr = LeaveRequest(
            employee_id=employee.id,
            start_date=start,
            end_date=end,
            reason=reason,
            status=status,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
        )
        db.session.add(lr)
        db.session.flush()

        # "Created" audit entry (always present)
        db.session.add(AuditLog(
            leave_request_id=lr.id,
            action='created',
            performed_by=employee.id,
            timestamp=lr.created_at,
            note='Leave request submitted',
        ))

        # Status-change audit entry (if not still pending)
        if status != 'pending' and reviewer:
            action_time = lr.created_at + timedelta(days=1)
            db.session.add(AuditLog(
                leave_request_id=lr.id,
                action=status,
                performed_by=reviewer.id,
                timestamp=action_time,
                note=f'{status.capitalize()} by {reviewer.name}',
            ))

        return lr

    alice, bob, carol, david = employees[0], employees[1], employees[2], employees[3]
    emily, frank, grace, henry = employees[4], employees[5], employees[6], employees[7]

    # --- Team 1 (Sarah's team) ---

    # Alice: approved past leave, one pending future
    create_leave(alice, today - timedelta(days=45), today - timedelta(days=42),
                 'Family reunion', 'approved', manager1)
    create_leave(alice, today + timedelta(days=10), today + timedelta(days=12),
                 'Dental appointments', 'pending')

    # Bob: one approved upcoming, one rejected
    create_leave(bob, today + timedelta(days=5), today + timedelta(days=6),
                 'Home renovation work', 'approved', manager1)
    create_leave(bob, today - timedelta(days=20), today - timedelta(days=15),
                 'Extended vacation', 'rejected', manager1)

    # Carol: heavy usage, one approved, one cancelled, one pending
    create_leave(carol, today - timedelta(days=60), today - timedelta(days=55),
                 'Medical procedure recovery', 'approved', manager1)
    create_leave(carol, today - timedelta(days=30), today - timedelta(days=28),
                 'Personal errands', 'cancelled', carol)
    create_leave(carol, today + timedelta(days=15), today + timedelta(days=18),
                 'Wedding attendance', 'pending')

    # David: fresh employee, one pending
    create_leave(david, today + timedelta(days=20), today + timedelta(days=22),
                 'Annual family holiday', 'pending')

    # --- Team 2 (James's team) ---

    # Emily: one approved, one pending
    create_leave(emily, today - timedelta(days=10), today - timedelta(days=8),
                 'Moving to new apartment', 'approved', manager2)
    create_leave(emily, today + timedelta(days=25), today + timedelta(days=27),
                 'Festival celebration', 'pending')

    # Frank: low balance, one approved past, one rejected
    create_leave(frank, today - timedelta(days=90), today - timedelta(days=80),
                 'Extended sick leave', 'approved', manager2)
    create_leave(frank, today + timedelta(days=3), today + timedelta(days=10),
                 'Vacation request', 'rejected', manager2)

    # Grace: one approved upcoming
    create_leave(grace, today + timedelta(days=7), today + timedelta(days=9),
                 'Volunteering event', 'approved', manager2)

    # Henry: no leave taken yet, one pending
    create_leave(henry, today + timedelta(days=30), today + timedelta(days=35),
                 'International travel', 'pending')

    db.session.commit()
    logger.info("Database seeded successfully with 2 managers, 8 employees, and sample leave data.")
