"""
SQLAlchemy models for LeaveTrack.

Three tables:
  - User:         Employees and managers. A manager has employees reporting to them.
  - LeaveRequest: A leave application with status (pending/approved/rejected/cancelled).
  - AuditLog:     Who changed a request's status and when.

All models use the shared `db` instance created in __init__.py.
"""

from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


# ---------------------------------------------------------------------------
# User Model
# ---------------------------------------------------------------------------

class User(db.Model):
    """
    Represents an employee or manager.

    Relationships:
      - manager_id → User.id  (self-referential: each employee has one manager)
      - A manager has many 'reports' (employees who report to them)
    """
    __tablename__ = 'users'

    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(100), nullable=False)
    email        = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role         = db.Column(db.String(20), nullable=False, default='employee')  # 'employee' or 'manager'
    manager_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # NULL for managers
    leave_balance = db.Column(db.Integer, nullable=False, default=20)  # Days per year
    avatar_color = db.Column(db.String(7), nullable=False, default='#4F46E5')  # Hex color for calendar chips
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Self-referential relationship: a manager has many reports
    reports = db.relationship('User', backref=db.backref('manager', remote_side=[id]), lazy='dynamic')

    # All leave requests made by this user
    leave_requests = db.relationship('LeaveRequest', backref='employee', lazy='dynamic',
                                     foreign_keys='LeaveRequest.employee_id')

    def set_password(self, password):
        """Hash and store a plaintext password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serialize user to a dictionary (excludes password hash)."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'manager_id': self.manager_id,
            'manager_name': self.manager.name if self.manager else None,
            'leave_balance': self.leave_balance,
            'avatar_color': self.avatar_color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }



# ---------------------------------------------------------------------------
# Leave Request Model
# ---------------------------------------------------------------------------

class LeaveRequest(db.Model):
    """
    A leave application submitted by an employee.

    Status flow:
      pending → approved  (by manager)
      pending → rejected  (by manager)
      pending → cancelled (by the employee themselves)
    """
    __tablename__ = 'leave_requests'

    id          = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date  = db.Column(db.Date, nullable=False)
    end_date    = db.Column(db.Date, nullable=False)
    reason      = db.Column(db.String(500), nullable=False)
    status      = db.Column(db.String(20), nullable=False, default='pending')
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))

    # Audit trail for this request
    audit_logs = db.relationship('AuditLog', backref='leave_request', lazy='dynamic',
                                  order_by='AuditLog.timestamp')

    def to_dict(self):
        """Serialize leave request to a dictionary."""
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee.name if self.employee else None,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'reason': self.reason,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'audit_trail': [log.to_dict() for log in self.audit_logs],
        }


# ---------------------------------------------------------------------------
# Audit Log Model
# ---------------------------------------------------------------------------

class AuditLog(db.Model):
    """
    Records who changed a leave request's status and when.
    Every create/approve/reject/cancel action gets an entry here.
    """
    __tablename__ = 'audit_logs'

    id               = db.Column(db.Integer, primary_key=True)
    leave_request_id = db.Column(db.Integer, db.ForeignKey('leave_requests.id'), nullable=False)
    action           = db.Column(db.String(50), nullable=False)  # 'created', 'approved', 'rejected', 'cancelled'
    performed_by     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    note             = db.Column(db.String(500), nullable=True)

    # Relationship to the user who performed the action
    performer = db.relationship('User', foreign_keys=[performed_by])

    def to_dict(self):
        """Serialize audit log entry to a dictionary."""
        return {
            'id': self.id,
            'leave_request_id': self.leave_request_id,
            'action': self.action,
            'performed_by': self.performed_by,
            'performer_name': self.performer.name if self.performer else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'note': self.note,
        }
