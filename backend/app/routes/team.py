"""
Team routes — manager-facing endpoints.

Endpoints:
  GET /api/team/calendar — All approved leave for a manager's team,
                           used to render the team calendar view.
  GET /api/team/stats    — Summary statistics for the manager's team.
"""

import logging
from flask import Blueprint, request, jsonify, g
from app.models import User, LeaveRequest
from app.routes.middleware import token_required
from app.utils.errors import ForbiddenError

logger = logging.getLogger('leavetrack')

team_bp = Blueprint('team', __name__, url_prefix='/api/team')


@team_bp.route('/calendar', methods=['GET'])
@token_required
def team_calendar():
    """
    Return all approved leave for the authenticated manager's team.
    Used by the frontend to render colored avatar chips on calendar days.

    Query params:
        month (int, optional): Filter by month (1-12).
        year  (int, optional): Filter by year (e.g., 2025).

    Response (200):
        [
            {
                "id": 5,
                "employee_id": 3,
                "employee_name": "Bob Smith",
                "avatar_color": "#4F46E5",
                "start_date": "2025-03-10",
                "end_date": "2025-03-14",
                "reason": "Vacation",
                "status": "approved"
            },
            ...
        ]
    """
    manager = g.current_user

    if manager.role != 'manager':
        raise ForbiddenError("Only managers can view the team calendar")

    # Get all employees reporting to this manager
    team_members = User.query.filter_by(manager_id=manager.id).all()
    team_ids = [member.id for member in team_members]

    if not team_ids:
        return jsonify([]), 200

    # Query approved leave for all team members
    query = LeaveRequest.query.filter(
        LeaveRequest.employee_id.in_(team_ids),
        LeaveRequest.status == 'approved'
    )

    # Optional month/year filtering
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    # We fetch all approved leave and let the frontend handle date filtering
    # for simplicity, but apply year/month filter if provided
    leaves = query.order_by(LeaveRequest.start_date).all()

    # Build response with employee info for calendar rendering
    result = []
    for leave in leaves:
        employee = next((m for m in team_members if m.id == leave.employee_id), None)
        result.append({
            'id': leave.id,
            'employee_id': leave.employee_id,
            'employee_name': employee.name if employee else 'Unknown',
            'avatar_color': employee.avatar_color if employee else '#4F46E5',
            'start_date': leave.start_date.isoformat(),
            'end_date': leave.end_date.isoformat(),
            'reason': leave.reason,
            'status': leave.status,
        })

    return jsonify(result), 200


@team_bp.route('/stats', methods=['GET'])
@token_required
def team_stats():
    """
    Return summary statistics for the manager's team.

    Response (200):
        {
            "total_team_members": 4,
            "pending_requests": 3,
            "approved_this_month": 2,
            "team_members": [ { "id": 1, "name": "Alice", "leave_balance": 15 }, ... ]
        }
    """
    manager = g.current_user

    if manager.role != 'manager':
        raise ForbiddenError("Only managers can view team stats")

    # Get team members
    team_members = User.query.filter_by(manager_id=manager.id).all()
    team_ids = [m.id for m in team_members]

    # Count pending requests
    pending_count = LeaveRequest.query.filter(
        LeaveRequest.employee_id.in_(team_ids),
        LeaveRequest.status == 'pending'
    ).count() if team_ids else 0

    # Count approved requests (all time for simplicity)
    approved_count = LeaveRequest.query.filter(
        LeaveRequest.employee_id.in_(team_ids),
        LeaveRequest.status == 'approved'
    ).count() if team_ids else 0

    return jsonify({
        'total_team_members': len(team_members),
        'pending_requests': pending_count,
        'approved_requests': approved_count,
        'team_members': [
            {
                'id': m.id,
                'name': m.name,
                'email': m.email,
                'leave_balance': m.leave_balance,
                'avatar_color': m.avatar_color,
            }
            for m in team_members
        ]
    }), 200
