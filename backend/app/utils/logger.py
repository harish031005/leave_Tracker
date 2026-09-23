"""
Structured logging setup for the application.

Creates a logger named 'leavetrack' that writes to both:
  - Console (for development visibility)
  - File: backend/leavetrack.log (for persistent audit)

Log levels used throughout the app:
  - INFO:    Normal flow (request created, leave approved, user logged in)
  - WARNING: Business rule violations (overlap detected, insufficient balance)
  - ERROR:   Unexpected exceptions
"""

import logging
import os

# Log file lives in the backend/ directory
LOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOG_FILE = os.path.join(LOG_DIR, 'leavetrack.log')


def setup_logger():
    """
    Configure and return the application logger.
    Call this once during app startup (in the app factory).
    """
    logger = logging.getLogger('leavetrack')
    logger.setLevel(logging.DEBUG)

    # Prevent duplicate handlers if called multiple times (e.g., in tests)
    if logger.handlers:
        return logger

    # Consistent format: timestamp | level | module | message
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-7s | %(module)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # --- Console handler (INFO and above) ---
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # --- File handler (DEBUG and above, captures everything) ---
    file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
