"""
Unit tests for the leave service — pure business-rule functions.

These tests call the service functions directly with plain Python values.
No Flask app, no database, no HTTP — just logic verification.
This is possible because leave_service.py has ZERO Flask/DB imports.
"""

import pytest
from datetime import date
from app.services.leave_service import (
    validate_date_range,
    calculate_days,
    check_balance,
    check_overlap,
    can_approve_or_reject,
    can_cancel,
    validate_transition,
)


# ===================================================================
# Date Validation Tests
# ===================================================================

class TestValidateDateRange:
    """Tests for validate_date_range()."""

    def test_valid_range_passes(self):
        """Same-day and multi-day ranges should not raise."""
        validate_date_range(date(2025, 3, 10), date(2025, 3, 14))  # Multi-day
        validate_date_range(date(2025, 3, 10), date(2025, 3, 10))  # Same day

    def test_end_before_start_raises(self):
        """End date before start date should raise ValueError."""
        with pytest.raises(ValueError, match="End date cannot be before start date"):
            validate_date_range(date(2025, 3, 14), date(2025, 3, 10))


class TestCalculateDays:
    """Tests for calculate_days()."""

    def test_single_day(self):
        """A single day (start == end) should return 1."""
        assert calculate_days(date(2025, 3, 10), date(2025, 3, 10)) == 1

    def test_multiple_days(self):
        """Mar 10 to Mar 14 = 5 days (inclusive)."""
        assert calculate_days(date(2025, 3, 10), date(2025, 3, 14)) == 5

    def test_two_days(self):
        """Mar 10 to Mar 11 = 2 days."""
        assert calculate_days(date(2025, 3, 10), date(2025, 3, 11)) == 2


# ===================================================================
# Balance Check Tests
# ===================================================================

class TestCheckBalance:
    """Tests for check_balance()."""

    def test_sufficient_balance_passes(self):
        """Should not raise when balance >= days requested."""
        check_balance(20, 5)   # Plenty of balance
        check_balance(5, 5)    # Exact match

    def test_insufficient_balance_raises(self):
        """Should raise ValueError when days requested > balance."""
        with pytest.raises(ValueError, match="Insufficient leave balance"):
            check_balance(3, 5)

    def test_zero_balance_raises(self):
        """Zero balance should reject any request."""
        with pytest.raises(ValueError, match="Insufficient leave balance"):
            check_balance(0, 1)


# ===================================================================
# Overlap Detection Tests
# ===================================================================

class TestCheckOverlap:
    """Tests for check_overlap()."""

    def test_no_existing_leaves_passes(self):
        """No existing leaves means no overlap."""
        check_overlap([], date(2025, 3, 10), date(2025, 3, 14))

    def test_non_overlapping_dates_pass(self):
        """Dates that don't intersect should pass."""
        existing = [(date(2025, 3, 1), date(2025, 3, 5))]
        check_overlap(existing, date(2025, 3, 10), date(2025, 3, 14))

    def test_adjacent_dates_pass(self):
        """Dates right next to each other (no overlap) should pass."""
        existing = [(date(2025, 3, 1), date(2025, 3, 5))]
        check_overlap(existing, date(2025, 3, 6), date(2025, 3, 10))

    def test_fully_overlapping_raises(self):
        """New request completely inside an existing one should raise."""
        existing = [(date(2025, 3, 1), date(2025, 3, 15))]
        with pytest.raises(ValueError, match="overlap"):
            check_overlap(existing, date(2025, 3, 5), date(2025, 3, 10))

    def test_partial_overlap_start_raises(self):
        """New request overlapping the end of an existing one should raise."""
        existing = [(date(2025, 3, 1), date(2025, 3, 10))]
        with pytest.raises(ValueError, match="overlap"):
            check_overlap(existing, date(2025, 3, 8), date(2025, 3, 14))

    def test_partial_overlap_end_raises(self):
        """New request overlapping the start of an existing one should raise."""
        existing = [(date(2025, 3, 10), date(2025, 3, 15))]
        with pytest.raises(ValueError, match="overlap"):
            check_overlap(existing, date(2025, 3, 8), date(2025, 3, 12))

    def test_exact_same_dates_raises(self):
        """Exact same dates should raise."""
        existing = [(date(2025, 3, 10), date(2025, 3, 14))]
        with pytest.raises(ValueError, match="overlap"):
            check_overlap(existing, date(2025, 3, 10), date(2025, 3, 14))

    def test_single_day_overlap_raises(self):
        """Overlap on a single day boundary should raise."""
        existing = [(date(2025, 3, 1), date(2025, 3, 10))]
        with pytest.raises(ValueError, match="overlap"):
            check_overlap(existing, date(2025, 3, 10), date(2025, 3, 15))

    def test_multiple_existing_leaves(self):
        """Should check against all existing leaves."""
        existing = [
            (date(2025, 3, 1), date(2025, 3, 5)),
            (date(2025, 3, 20), date(2025, 3, 25)),
        ]
        # This overlaps with the second range
        with pytest.raises(ValueError, match="overlap"):
            check_overlap(existing, date(2025, 3, 22), date(2025, 3, 28))


# ===================================================================
# Authorization Tests
# ===================================================================

class TestCanApproveOrReject:
    """Tests for can_approve_or_reject()."""

    def test_manager_approving_own_team_passes(self):
        """Manager should be able to approve their direct report's request."""
        can_approve_or_reject(actor_role='manager', actor_id=1, employee_manager_id=1)

    def test_employee_cannot_approve(self):
        """Employees should not be able to approve leave."""
        with pytest.raises(PermissionError, match="Only managers"):
            can_approve_or_reject(actor_role='employee', actor_id=2, employee_manager_id=1)

    def test_wrong_manager_cannot_approve(self):
        """A manager can't approve leave for another manager's team."""
        with pytest.raises(PermissionError, match="your own team"):
            can_approve_or_reject(actor_role='manager', actor_id=99, employee_manager_id=1)


class TestCanCancel:
    """Tests for can_cancel()."""

    def test_owner_cancels_pending_passes(self):
        """An employee should be able to cancel their own pending request."""
        can_cancel(actor_id=5, employee_id=5, current_status='pending')

    def test_non_owner_cannot_cancel(self):
        """A different employee should not be able to cancel someone else's request."""
        with pytest.raises(PermissionError, match="your own"):
            can_cancel(actor_id=6, employee_id=5, current_status='pending')

    def test_cannot_cancel_approved(self):
        """Should not be able to cancel an already-approved request."""
        with pytest.raises(ValueError, match="already 'approved'"):
            can_cancel(actor_id=5, employee_id=5, current_status='approved')

    def test_cannot_cancel_rejected(self):
        """Should not be able to cancel an already-rejected request."""
        with pytest.raises(ValueError, match="already 'rejected'"):
            can_cancel(actor_id=5, employee_id=5, current_status='rejected')

    def test_cannot_cancel_already_cancelled(self):
        """Should not be able to cancel an already-cancelled request."""
        with pytest.raises(ValueError, match="already 'cancelled'"):
            can_cancel(actor_id=5, employee_id=5, current_status='cancelled')


# ===================================================================
# Status Transition Tests
# ===================================================================

class TestValidateTransition:
    """Tests for validate_transition()."""

    def test_pending_to_approved(self):
        """pending → approved is valid."""
        validate_transition('pending', 'approved')

    def test_pending_to_rejected(self):
        """pending → rejected is valid."""
        validate_transition('pending', 'rejected')

    def test_pending_to_cancelled(self):
        """pending → cancelled is valid."""
        validate_transition('pending', 'cancelled')

    def test_approved_to_anything_raises(self):
        """approved → anything should raise."""
        with pytest.raises(ValueError, match="Cannot transition"):
            validate_transition('approved', 'rejected')

    def test_rejected_to_anything_raises(self):
        """rejected → anything should raise."""
        with pytest.raises(ValueError, match="Cannot transition"):
            validate_transition('rejected', 'approved')

    def test_cancelled_to_anything_raises(self):
        """cancelled → anything should raise."""
        with pytest.raises(ValueError, match="Cannot transition"):
            validate_transition('cancelled', 'pending')
