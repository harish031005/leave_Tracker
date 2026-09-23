"""
Leave request routes — the main CRUD + status-change endpoints.

Endpoints:
  POST /api/leave-requests                — Create a new leave request.
  GET  /api/leave-requests                — List requests (with optional filters).
  GET  /api/leave-requests/<id>           — Get a single request's detail.
  PUT  /api/leave-requests/<id>/approve   — Manager approves a pending request.
  PUT  /api/leave-requests/<id>/reject    — Manager rejects a pending request.
  PUT  /api/leave-requests/<id>/cancel    — Employee cancels their own pending request.

Each endpoint delegates business-rule checks to the service layer
(app.services.leave_service), then performs DB operations only if
validation passes.
"""

import logging
from datetime import date, datetime, timezone
from flask import Blueprint, request, jsonify, g
from app import db
from app.models import LeaveRequest, AuditLog, User
from app.services import leave_service
from app.routes.middleware import token_required
from app.utils.errors import ValidationError, NotFoundError, ForbiddenError

logger = logging.getLogger('leavetrack')

leave_bp = Blueprint('leave_requests', __name__, url_prefix='/api/leave-requests')


# ---------------------------------------------------------------------------
# Helper: parse a date string (YYYY-MM-DD) safely
# ---------------------------------------------------------------------------

def _parse_date(date_string: str, field_name: str) -> date:
    """Parse a YYYY-MM-DD string into a date object, or raise ValidationError."""
    try:
        return date.fromisoformat(date_string)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid {field_name}: expected YYYY-MM-DD format")


# ---------------------------------------------------------------------------
# POST /api/leave-requests — Create a new leave request
# ---------------------------------------------------------------------------

@leave_bp.route('', methods=['POST'])
@token_required
def create_request():
    """
    Create a new leave request for the authenticated employee.

    Request body (JSON):
        {
            "start_date": "2025-03-10",
            "end_date": "2025-03-14",
            "reason": "Family vacation"
        }

    Business rules enforced:
        1. End date >= start date.
        2. No overlap with existing pending/approved leave.
        3. Requested days <= current leave balance.

    Response (201):
        The newly created leave request object.
    """
    user = g.current_user
    data = request.get_json()

    # --- Parse and validate input ---
    if not data:
        raise ValidationError("Request body is required")

    start_date = _parse_date(data.get('start_date'), 'start_date')
    end_date = _parse_date(data.get('end_date'), 'end_date')
    reason = data.get('reason', '').strip()

    if not reason:
        raise ValidationError("Reason is required")

    # --- Rule 1: Valid date range ---
    try:
        leave_service.validate_date_range(start_date, end_date)
    except ValueError as e:
        logger.warning(f"Invalid date range for user {user.id}: {e}")
        raise ValidationError(str(e))

    # --- Rule 2: No overlap with existing leave ---
    existing = LeaveRequest.query.filter(
        LeaveRequest.employee_id == user.id,
        LeaveRequest.status.in_(['pending', 'approved'])
    ).all()
    existing_ranges = [(req.start_date, req.end_date) for req in existing]

    try:
        leave_service.check_overlap(existing_ranges, start_date, end_date)
    except ValueError as e:
        logger.warning(f"Overlap detected for user {user.id}: {e}")
        raise ValidationError(str(e))

    # --- Rule 3: Sufficient balance ---
    days_requested = leave_service.calculate_days(start_date, end_date)
    try:
        leave_service.check_balance(user.leave_balance, days_requested)
    except ValueError as e:
        logger.warning(f"Insufficient balance for user {user.id}: {e}")
        raise ValidationError(str(e))

    # --- All rules passed — create the request ---
    leave_request = LeaveRequest(
        employee_id=user.id,
        start_date=start_date,
        end_date=end_date,
        reason=reason,
        status='pending'
    )
    db.session.add(leave_request)
    db.session.flush()  # Get the ID before creating the audit log

    # Record the creation in the audit trail
    audit = AuditLog(
        leave_request_id=leave_request.id,
        action='created',
        performed_by=user.id,
        note='Leave request submitted'
    )
    db.session.add(audit)
    db.session.commit()

    logger.info(f"Leave request #{leave_request.id} created by user {user.id} "
                f"({start_date} to {end_date}, {days_requested} days)")

    return jsonify(leave_request.to_dict()), 201


# ---------------------------------------------------------------------------
# GET /api/leave-requests — List requests with optional filters
# ---------------------------------------------------------------------------

@leave_bp.route('', methods=['GET'])
@token_required
def list_requests():
    """
    List leave requests, optionally filtered by scope (my/team), employee_id, and/or status.

    Query params:
        scope (str, optional): 'my' (only current user) or 'team' (managed team members).
        employee_id (int, optional): Filter by a specific employee.
        status (str, optional): Filter by status (pending/approved/rejected/cancelled).

    Response (200):
        [ { leave request }, ... ]
    """
    current_user = g.current_user
    scope = request.args.get('scope')
    employee_id = request.args.get('employee_id', type=int)
    status = request.args.get('status')

    query = LeaveRequest.query

    if scope == 'my':
        query = query.filter(LeaveRequest.employee_id == current_user.id)
    elif scope == 'team':
        if current_user.role != 'manager':
            raise ForbiddenError("Only managers can view team leave requests")
        team_members = User.query.filter_by(manager_id=current_user.id).all()
        team_ids = [m.id for m in team_members]
        if not team_ids:
            return jsonify([]), 200
        query = query.filter(LeaveRequest.employee_id.in_(team_ids))
    elif employee_id:
        query = query.filter_by(employee_id=employee_id)
    elif current_user.role == 'employee':
        # Default behavior for employees: only show their own applications
        query = query.filter(LeaveRequest.employee_id == current_user.id)

    # Filter by status if provided
    if status:
        query = query.filter_by(status=status)

    # Order by most recent first
    requests = query.order_by(LeaveRequest.created_at.desc()).all()
    return jsonify([req.to_dict() for req in requests]), 200


# ---------------------------------------------------------------------------
# GET /api/leave-requests/<id> — Get a single request's detail
# ---------------------------------------------------------------------------

@leave_bp.route('/<int:request_id>', methods=['GET'])
@token_required
def get_request(request_id):
    """
    Get the full detail of a single leave request, including its audit trail.

    Response (200):
        { leave request with audit_trail }
    """
    leave_request = LeaveRequest.query.get(request_id)
    if not leave_request:
        raise NotFoundError(f"Leave request #{request_id} not found")

    return jsonify(leave_request.to_dict()), 200


# ---------------------------------------------------------------------------
# PUT /api/leave-requests/<id>/approve — Manager approves
# ---------------------------------------------------------------------------

@leave_bp.route('/<int:request_id>/approve', methods=['PUT'])
@token_required
def approve_request(request_id):
    """
    Approve a pending leave request. Only the employee's direct manager
    can do this. Deducts the leave balance upon approval.

    Response (200):
        The updated leave request object.
    """
    manager = g.current_user
    leave_request = LeaveRequest.query.get(request_id)

    if not leave_request:
        raise NotFoundError(f"Leave request #{request_id} not found")

    employee = User.query.get(leave_request.employee_id)

    # --- Authorization: only the employee's manager can approve ---
    try:
        leave_service.can_approve_or_reject(manager.role, manager.id, employee.manager_id)
    except PermissionError as e:
        logger.warning(f"Unauthorized approval attempt by user {manager.id}: {e}")
        raise ForbiddenError(str(e))

    # --- Status transition check ---
    try:
        leave_service.validate_transition(leave_request.status, 'approved')
    except ValueError as e:
        raise ValidationError(str(e))

    # --- Approve and deduct balance ---
    days = leave_service.calculate_days(leave_request.start_date, leave_request.end_date)
    leave_request.status = 'approved'
    employee.leave_balance -= days

    # Audit trail
    audit = AuditLog(
        leave_request_id=leave_request.id,
        action='approved',
        performed_by=manager.id,
        note=f'Approved by {manager.name}'
    )
    db.session.add(audit)
    db.session.commit()

    logger.info(f"Leave request #{request_id} approved by manager {manager.id}. "
                f"Balance deducted: {days} days. New balance: {employee.leave_balance}")

    return jsonify(leave_request.to_dict()), 200


# ---------------------------------------------------------------------------
# PUT /api/leave-requests/<id>/reject — Manager rejects
# ---------------------------------------------------------------------------

@leave_bp.route('/<int:request_id>/reject', methods=['PUT'])
@token_required
def reject_request(request_id):
    """
    Reject a pending leave request. Only the employee's direct manager
    can do this. No balance is deducted.

    Response (200):
        The updated leave request object.
    """
    manager = g.current_user
    leave_request = LeaveRequest.query.get(request_id)

    if not leave_request:
        raise NotFoundError(f"Leave request #{request_id} not found")

    employee = User.query.get(leave_request.employee_id)

    # --- Authorization ---
    try:
        leave_service.can_approve_or_reject(manager.role, manager.id, employee.manager_id)
    except PermissionError as e:
        logger.warning(f"Unauthorized rejection attempt by user {manager.id}: {e}")
        raise ForbiddenError(str(e))

    # --- Status transition check ---
    try:
        leave_service.validate_transition(leave_request.status, 'rejected')
    except ValueError as e:
        raise ValidationError(str(e))

    # --- Reject (no balance change) ---
    leave_request.status = 'rejected'

    # Audit trail
    audit = AuditLog(
        leave_request_id=leave_request.id,
        action='rejected',
        performed_by=manager.id,
        note=f'Rejected by {manager.name}'
    )
    db.session.add(audit)
    db.session.commit()

    logger.info(f"Leave request #{request_id} rejected by manager {manager.id}")

    return jsonify(leave_request.to_dict()), 200


# ---------------------------------------------------------------------------
# PUT /api/leave-requests/<id>/cancel — Employee cancels their own
# ---------------------------------------------------------------------------

@leave_bp.route('/<int:request_id>/cancel', methods=['PUT'])
@token_required
def cancel_request(request_id):
    """
    Cancel a pending leave request. Only the employee who created the
    request can cancel it, and only if it's still pending.

    Response (200):
        The updated leave request object.
    """
    user = g.current_user
    leave_request = LeaveRequest.query.get(request_id)

    if not leave_request:
        raise NotFoundError(f"Leave request #{request_id} not found")

    # --- Authorization + status check ---
    try:
        leave_service.can_cancel(user.id, leave_request.employee_id, leave_request.status)
    except PermissionError as e:
        raise ForbiddenError(str(e))
    except ValueError as e:
        raise ValidationError(str(e))

    # --- Status transition check ---
    try:
        leave_service.validate_transition(leave_request.status, 'cancelled')
    except ValueError as e:
        raise ValidationError(str(e))

    # --- Cancel (no balance change since balance is only deducted on approval) ---
    leave_request.status = 'cancelled'

    # Audit trail
    audit = AuditLog(
        leave_request_id=leave_request.id,
        action='cancelled',
        performed_by=user.id,
        note=f'Cancelled by {user.name}'
    )
    db.session.add(audit)
    db.session.commit()

    logger.info(f"Leave request #{request_id} cancelled by user {user.id}")

    return jsonify(leave_request.to_dict()), 200
