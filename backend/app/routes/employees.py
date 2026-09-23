"""
Employee routes.

Endpoints:
  GET /api/employees/me             — Current user's profile.
  GET /api/employees/<id>/balance   — A specific user's leave balance.
"""

import logging
from flask import Blueprint, jsonify, g
from app.models import User
from app.routes.middleware import token_required
from app.utils.errors import NotFoundError

logger = logging.getLogger('leavetrack')

employees_bp = Blueprint('employees', __name__, url_prefix='/api/employees')


@employees_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """
    Return the profile of the currently authenticated user.

    Response (200):
        { "id": 1, "name": "Alice", "email": "alice@example.com", ... }
    """
    return jsonify(g.current_user.to_dict()), 200


@employees_bp.route('/managers', methods=['GET'])
@token_required
def list_managers():
    """
    Return list of all managers in the system.
    """
    managers = User.query.filter_by(role='manager').all()
    return jsonify([m.to_dict() for m in managers]), 200


@employees_bp.route('', methods=['POST'])
@token_required
def create_employee():
    """
    Create a new employee or manager. Only managers can add users.

    Request JSON:
        {
            "name": "Jane Doe",
            "email": "jane@leavetrack.com",
            "password": "password123",
            "role": "employee" | "manager",
            "manager_id": 1 (optional),
            "leave_balance": 20 (optional),
            "avatar_color": "#4F46E5" (optional)
        }
    """
    from flask import request
    from app import db
    from app.utils.errors import ValidationError, ForbiddenError

    current_user = g.current_user
    if current_user.role != 'manager':
        raise ForbiddenError("Only managers are allowed to add new employees or managers")

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', 'employee').strip().lower()
    manager_id = data.get('manager_id')
    leave_balance = data.get('leave_balance', 20)
    avatar_color = data.get('avatar_color', '#4F46E5')

    if not name:
        raise ValidationError("Name is required")
    if not email:
        raise ValidationError("Email is required")
    if not password:
        raise ValidationError("Password is required")
    if role not in ['employee', 'manager']:
        raise ValidationError("Role must be 'employee' or 'manager'")

    # Check for duplicate email
    if User.query.filter_by(email=email).first():
        raise ValidationError(f"User with email '{email}' already exists")

    # If role is employee and manager_id is not specified, default to current manager
    if role == 'employee' and not manager_id:
        manager_id = current_user.id
    elif role == 'manager':
        manager_id = None

    if manager_id:
        mgr = User.query.get(manager_id)
        if not mgr or mgr.role != 'manager':
            raise ValidationError("Specified manager ID does not exist or is not a manager")

    new_user = User(
        name=name,
        email=email,
        role=role,
        manager_id=manager_id,
        leave_balance=leave_balance,
        avatar_color=avatar_color
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    logger.info(f"Manager {current_user.id} created new user {new_user.id} ({new_user.name}, role={new_user.role})")
    return jsonify(new_user.to_dict()), 201


@employees_bp.route('/<int:user_id>/assign-manager', methods=['PUT'])
@token_required
def assign_manager(user_id):
    """
    Reassign an employee to a different manager. Only managers can perform this.
    """
    from flask import request
    from app import db
    from app.utils.errors import ValidationError, ForbiddenError

    current_user = g.current_user
    if current_user.role != 'manager':
        raise ForbiddenError("Only managers can allocate/assign employees to managers")

    user = User.query.get(user_id)
    if not user:
        raise NotFoundError(f"Employee with ID {user_id} not found")

    data = request.get_json() or {}
    new_manager_id = data.get('manager_id')

    if new_manager_id is not None:
        mgr = User.query.get(new_manager_id)
        if not mgr or mgr.role != 'manager':
            raise ValidationError("Target manager ID does not exist or is not a manager")

    user.manager_id = new_manager_id
    db.session.commit()

    logger.info(f"User #{user.id} ({user.name}) manager updated to {new_manager_id} by manager {current_user.id}")
    return jsonify(user.to_dict()), 200


@employees_bp.route('/<int:user_id>/balance', methods=['GET'])
@token_required
def get_balance(user_id):
    """
    Return the leave balance for a specific user.

    Response (200):
        { "user_id": 1, "name": "Alice", "leave_balance": 15 }
    """
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError(f"Employee with ID {user_id} not found")

    return jsonify({
        'user_id': user.id,
        'name': user.name,
        'leave_balance': user.leave_balance,
    }), 200
