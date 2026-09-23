"""
Flask Application Factory.

This is the entry point for creating the Flask app. It:
  1. Creates the Flask instance and loads config.
  2. Initializes the SQLAlchemy database.
  3. Registers all route blueprints.
  4. Registers centralized error handlers.
  5. Sets up structured logging.

Usage:
    from app import create_app
    app = create_app('development')   # or 'testing', 'production'
"""

import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Create the SQLAlchemy instance here so models.py can import it
db = SQLAlchemy()

dist_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))


def create_app(config_name='development'):
    """
    Application factory — creates and configures the Flask app.

    Args:
        config_name: Which config to use ('development', 'testing', 'production').

    Returns:
        A configured Flask app instance, ready to serve requests.
    """
    app = Flask(
        __name__,
        static_folder=dist_folder if os.path.exists(dist_folder) else None,
        static_url_path=''
    )

    # --- Load configuration ---
    config_map = {
        'development': 'app.config.DevelopmentConfig',
        'testing':     'app.config.TestingConfig',
        'production':  'app.config.ProductionConfig',
    }
    app.config.from_object(config_map.get(config_name, config_map['development']))

    # --- Initialize extensions ---
    db.init_app(app)
    CORS(app)  # Allow cross-origin requests from the React frontend

    # --- Set up logging ---
    from app.utils.logger import setup_logger
    setup_logger()

    # --- Register error handlers ---
    from app.utils.errors import register_error_handlers
    register_error_handlers(app)

    # --- Register route blueprints ---
    from app.routes.auth import auth_bp
    from app.routes.employees import employees_bp
    from app.routes.leave_requests import leave_bp
    from app.routes.team import team_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(leave_bp)
    app.register_blueprint(team_bp)

    # --- Serve React Frontend SPA (Single URL for both frontend & API) ---
    if os.path.exists(dist_folder):
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_frontend(path):
            if path and os.path.exists(os.path.join(dist_folder, path)):
                return send_from_directory(dist_folder, path)
            return send_from_directory(dist_folder, 'index.html')

    # --- Create database tables ---
    with app.app_context():
        # Import models so SQLAlchemy knows about them
        from app import models  # noqa: F401
        db.create_all()

    return app
