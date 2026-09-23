import { useState } from 'react';
import api from '../api/client';
import { useToast } from './Toast';

export default function LeaveModal({ isOpen, onClose, onSuccess, currentBalance }) {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculate requested days
  let requestedDays = 0;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const diffTime = Math.abs(end - start);
      requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate || !reason.trim()) {
      setError('All fields are required.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    if (requestedDays > currentBalance) {
      setError(`Requested duration (${requestedDays} days) exceeds available balance (${currentBalance} days).`);
      return;
    }

    setLoading(true);

    try {
      await api.post('/leave-requests', {
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      showToast('Leave request submitted successfully!', 'success');
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit leave request.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg shadow-2xl border border-default bg-surface rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo/10 text-indigo flex items-center justify-center font-bold text-lg">
              📅
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Apply for Leave</h2>
              <p className="text-xs text-secondary">Submit a new leave application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary text-xl font-bold p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose/10 border border-rose/20 text-rose-dark dark:text-rose-light text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                id="leave-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                End Date
              </label>
              <input
                id="leave-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
            </div>
          </div>

          {/* Duration Banner */}
          {requestedDays > 0 && (
            <div className="p-3 rounded-xl bg-indigo/5 border border-indigo/10 flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">Total Duration</span>
              <span className="text-sm font-bold text-indigo">
                {requestedDays} {requestedDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Reason for Leave
            </label>
            <textarea
              id="leave-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual family vacation, personal errands, medical appointment..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="submit-leave-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo hover:bg-indigo-dark text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="animate-spin">⏳</span>}
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
