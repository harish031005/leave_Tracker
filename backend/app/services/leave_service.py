"""
Leave business-rule functions — the heart of LeaveTrack's domain logic.

IMPORTANT: This module has NO imports from Flask, SQLAlchemy, or any database
layer. Every function works with plain Python types (dates, ints, strings,
lists of tuples). This is intentional — it means every rule can be unit-tested
by calling the function directly with test data, no database or app context
needed.

The route handlers in routes/leave_requests.py are responsible for:
  1. Extracting the relevant plain values from the database models.
  2. Calling these functions to validate/enforce rules.
  3. Performing the database writes if validation passes.
"""

from datetime import date


# ---------------------------------------------------------------------------
# Date Validation
# ---------------------------------------------------------------------------

def validate_date_range(start_date: date, end_date: date) -> None:
    """
    Ensure the end date is not before the start date.

    Args:
        start_date: First day of leave.
        end_date:   Last day of leave.

    Raises:
        ValueError: If end_date < start_date.
    """
    if end_date < start_date:
        raise ValueError("End date cannot be before start date")


def calculate_days(start_date: date, end_date: date) -> int:
    """
    Calculate the number of leave days (inclusive of both start and end).

    Example: start=Jan 1, end=Jan 3 → 3 days.

    Args:
        start_date: First day of leave.
        end_date:   Last day of leave.

    Returns:
        Number of days (always >= 1 if dates are valid).
    """
    return (end_date - start_date).days + 1


# ---------------------------------------------------------------------------
# Balance Check
# ---------------------------------------------------------------------------

def check_balance(current_balance: int, days_requested: int) -> None:
    """
    Ensure the employee has enough leave balance for this request.

    Note: Balance is checked at request time but only *deducted* when
    the manager approves. This function is a pre-check.

    Args:
        current_balance: Employee's current available leave days.
        days_requested:  Number of days in the new request.

    Raises:
        ValueError: If days_requested > current_balance.
    """
    if days_requested > current_balance:
        raise ValueError(
            f"Insufficient leave balance. Available: {current_balance} days, "
            f"requested: {days_requested} days"
        )


# ---------------------------------------------------------------------------
# Overlap Detection
# ---------------------------------------------------------------------------

def check_overlap(existing_leaves: list, start_date: date, end_date: date) -> None:
    """
    Ensure the new request doesn't overlap with any existing pending or
    approved leave for the same employee.

    Two date ranges [A_start, A_end] and [B_start, B_end] overlap when:
        A_start <= B_end  AND  B_start <= A_end

    Args:
        existing_leaves: List of (start_date, end_date) tuples for the
                         employee's pending/approved leave.
        start_date:      Start of the new request.
        end_date:        End of the new request.

    Raises:
        ValueError: If any overlap is found.
    """
    for existing_start, existing_end in existing_leaves:
        if start_date <= existing_end and existing_start <= end_date:
            raise ValueError(
                f"Leave dates overlap with an existing request "
                f"({existing_start.isoformat()} to {existing_end.isoformat()})"
            )


# ---------------------------------------------------------------------------
# Authorization Checks
# ---------------------------------------------------------------------------

def can_approve_or_reject(actor_role: str, actor_id: int, employee_manager_id: int) -> None:
    """
    Verify that the actor (the person clicking approve/reject) is the
    employee's direct manager.

    Args:
        actor_role:          Role of the person trying to approve ('employee' or 'manager').
        actor_id:            User ID of the person trying to approve.
        employee_manager_id: The manager_id field of the employee who made the request.

    Raises:
        PermissionError: If the actor is not the employee's manager.
    """
    if actor_role != 'manager':
        raise PermissionError("Only managers can approve or reject leave requests")

    if actor_id != employee_manager_id:
        raise PermissionError("You can only approve/reject requests from your own team members")


def can_cancel(actor_id: int, employee_id: int, current_status: str) -> None:
    """
    Verify that an employee can cancel this request.

    Rules:
      - Only the employee who created the request can cancel it.
      - Only pending requests can be cancelled (not approved/rejected/cancelled).

    Args:
        actor_id:       User ID of the person trying to cancel.
        employee_id:    User ID of the employee who owns the request.
        current_status: Current status of the request.

    Raises:
        PermissionError: If the actor is not the request owner.
        ValueError:      If the request is not in 'pending' status.
    """
    if actor_id != employee_id:
        raise PermissionError("You can only cancel your own leave requests")

    if current_status != 'pending':
        raise ValueError(f"Cannot cancel a request that is already '{current_status}'")


# ---------------------------------------------------------------------------
# Status Transition Validation
# ---------------------------------------------------------------------------

# Valid transitions: current_status → set of allowed target statuses
VALID_TRANSITIONS = {
    'pending':   {'approved', 'rejected', 'cancelled'},
    'approved':  set(),      # No further transitions allowed
    'rejected':  set(),      # No further transitions allowed
    'cancelled': set(),      # No further transitions allowed
}


def validate_transition(current_status: str, target_status: str) -> None:
    """
    Ensure the status transition is valid.

    Args:
        current_status: The request's current status.
        target_status:  The desired new status.

    Raises:
        ValueError: If the transition is not allowed.
    """
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise ValueError(
            f"Cannot transition from '{current_status}' to '{target_status}'"
        )
