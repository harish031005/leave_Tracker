"""
Configuration classes for the Flask application.

Three configs:
  - DevelopmentConfig: SQLite, debug on, used during local development.
  - TestingConfig: In-memory SQLite, used by pytest.
  - ProductionConfig: Swap DATABASE_URI to a MySQL connection string.

To switch to MySQL, change SQLALCHEMY_DATABASE_URI to:
    'mysql+pymysql://user:password@localhost/leavetrack'
"""

import os

# Base directory of the backend folder (one level up from app/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class Config:
    """Base configuration shared by all environments."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'leavetrack-dev-secret-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Suppress Flask-SQLAlchemy warning
    JWT_EXPIRATION_HOURS = 24               # How long a login token stays valid


class DevelopmentConfig(Config):
    """Local development — SQLite file in the backend/ folder."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "leavetrack.db")}'


class TestingConfig(Config):
    """pytest — in-memory SQLite, faster and disposable."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    """Production — swap the URI to MySQL or Postgres."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'sqlite:///{os.path.join(BASE_DIR, "leavetrack.db")}'
    )
