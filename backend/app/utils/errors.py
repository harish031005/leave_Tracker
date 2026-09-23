"""
Centralized error handling for the Flask application.

Custom exception classes map directly to HTTP status codes.
The register_error_handlers() function installs Flask error handlers
that catch these exceptions and return consistent JSON responses.

Usage in routes:
    from app.utils.errors import ValidationError, NotFoundError, ForbiddenError
    raise ValidationError("End date must be after start date")
    # → {"error": "End date must be after start date", "code": 400}
"""

from flask import jsonify


# ---------------------------------------------------------------------------
# Custom Exception Classes
# ---------------------------------------------------------------------------

class AppError(Exception):
    """Base exception for all application errors."""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(AppError):
    """400 — Bad request / business rule violation."""
    def __init__(self, message):
        super().__init__(message, status_code=400)


class NotFoundError(AppError):
    """404 — Resource not found."""
    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)


class ForbiddenError(AppError):
    """403 — User lacks permission for this action."""
    def __init__(self, message="You do not have permission to perform this action"):
        super().__init__(message, status_code=403)


class UnauthorizedError(AppError):
    """401 — Authentication required or invalid token."""
    def __init__(self, message="Authentication required"):
        super().__init__(message, status_code=401)


# ---------------------------------------------------------------------------
# Flask Error Handler Registration
# ---------------------------------------------------------------------------

def register_error_handlers(app):
    """
    Register error handlers on the Flask app so that any raised AppError
    (or subclass) is automatically caught and returned as a JSON response.
    Also handles generic 404 and 500 errors.
    """

    @app.errorhandler(AppError)
    def handle_app_error(error):
        """Catch any AppError subclass and return JSON."""
        response = jsonify({
            "error": error.message,
            "code": error.status_code
        })
        response.status_code = error.status_code
        return response

    @app.errorhandler(404)
    def handle_404(error):
        """Catch Flask's built-in 404 (e.g., unknown URL)."""
        return jsonify({"error": "Not found", "code": 404}), 404

    @app.errorhandler(500)
    def handle_500(error):
        """Catch unhandled server errors."""
        return jsonify({"error": "Internal server error", "code": 500}), 500
