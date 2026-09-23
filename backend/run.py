"""
Application entry point.

Start the Flask development server:
    cd backend
    python run.py

This creates the app, seeds the database on first run, and starts
the server on http://localhost:5000.
"""

from app import create_app
from app.seed import seed_database

# Create the Flask app using the development config
app = create_app('development')

# Seed the database with sample data on first run
with app.app_context():
    seed_database()

if __name__ == '__main__':
    print("\n  LeaveTrack Backend running at http://localhost:5000")
    print("  Press Ctrl+C to stop.\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
