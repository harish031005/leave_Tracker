"""
Authentication routes.

Endpoints:
  POST /api/auth/login — Authenticate a user and return a JWT token.
  GET  /api/auth/users — List all users (for the demo login dropdown).
"""

import logging
from flask import Blueprint, request, jsonify, current_app
from app.models import User
from app.services.auth_service import generate_token
from app.utils.errors import ValidationError, UnauthorizedError

logger = logging.getLogger('leavetrack')

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user with email and password.

    Request body (JSON):
        { "email": "alice@example.com", "password": "password123" }

    Response (200):
        {
            "token": "eyJ...",
            "user": { "id": 1, "name": "Alice", "role": "employee", ... }
        }
    """
    data = request.get_json()

    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        raise ValidationError("Email and password are required")

    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        raise UnauthorizedError("Invalid email or password")

    # Generate JWT token
    token = generate_token(
        user_id=user.id,
        role=user.role,
        secret_key=current_app.config['SECRET_KEY'],
        expiration_hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24)
    )

    logger.info(f"User logged in: {user.email} (role: {user.role})")

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/users', methods=['GET'])
def list_users():
    """
    Return all users for the demo login dropdown.
    This is a convenience endpoint — in production you'd never expose this.

    Response (200):
        [{ "id": 1, "name": "Alice", "email": "alice@example.com", "role": "employee" }, ...]
    """
    users = User.query.order_by(User.role.desc(), User.name).all()
    return jsonify([user.to_dict() for user in users]), 200
