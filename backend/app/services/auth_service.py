"""
Authentication service — JWT token generation and validation.

Uses PyJWT to create/verify JSON Web Tokens. The token payload contains
the user's ID and role, which the route-level decorator uses to identify
the current user on each request.
"""

import jwt
from datetime import datetime, timedelta, timezone


def generate_token(user_id: int, role: str, secret_key: str, expiration_hours: int = 24) -> str:
    """
    Create a signed JWT token for a user.

    Args:
        user_id:          The user's database ID.
        role:             'employee' or 'manager'.
        secret_key:       The app's SECRET_KEY for signing.
        expiration_hours: How many hours the token is valid.

    Returns:
        A JWT token string.
    """
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=expiration_hours),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')


def decode_token(token: str, secret_key: str) -> dict:
    """
    Decode and verify a JWT token.

    Args:
        token:      The JWT token string.
        secret_key: The app's SECRET_KEY used during signing.

    Returns:
        The decoded payload dict with 'user_id' and 'role'.

    Raises:
        jwt.ExpiredSignatureError: If the token has expired.
        jwt.InvalidTokenError:     If the token is malformed or tampered with.
    """
    return jwt.decode(token, secret_key, algorithms=['HS256'])
