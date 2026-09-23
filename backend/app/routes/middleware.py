"""
Authentication decorator for protecting API routes.

Extracts the JWT token from the Authorization header, decodes it,
loads the user from the database, and passes them to the route handler
via Flask's `g` object.

Usage in routes:
    from app.routes.middleware import token_required

    @some_bp.route('/protected')
    @token_required
    def protected_route():
        current_user = g.current_user  # The authenticated User object
        ...
"""

import logging
from functools import wraps
from flask import request, g, current_app
from app.models import User
from app.services.auth_service import decode_token
from app.utils.errors import UnauthorizedError

logger = logging.getLogger('leavetrack')


def token_required(f):
    """
    Decorator that requires a valid JWT token in the Authorization header.
    Sets g.current_user to the authenticated User object.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Extract token from "Authorization: Bearer <token>" header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            raise UnauthorizedError("Missing or invalid Authorization header")

        token = auth_header.split(' ', 1)[1]

        try:
            payload = decode_token(token, current_app.config['SECRET_KEY'])
        except Exception as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise UnauthorizedError("Invalid or expired token")

        # Load the user from the database
        user = User.query.get(payload['user_id'])
        if not user:
            raise UnauthorizedError("User not found")

        # Store the authenticated user on Flask's g object
        g.current_user = user
        return f(*args, **kwargs)

    return decorated
