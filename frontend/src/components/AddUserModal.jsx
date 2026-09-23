import { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from './Toast';

export default function AddUserModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [managerId, setManagerId] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(20);
  const [avatarColor, setAvatarColor] = useState('#4F46E5');

  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Color options
  const colorOptions = [
    '#4F46E5', '#7C3AED', '#059669', '#D97706',
    '#DC2626', '#0891B2', '#2563EB', '#EA580C'
  ];

  // Fetch managers when modal opens
  useEffect(() => {
    if (!isOpen) return;
    async function fetchManagers() {
      setLoadingManagers(true);
      try {
        const res = await api.get('/employees/managers');
        setManagers(res.data || []);
        if (res.data && res.data.length > 0) {
          setManagerId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load managers list:', err);
      } finally {
        setLoadingManagers(false);
      }
    }
    fetchManagers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        manager_id: role === 'employee' ? (managerId ? parseInt(managerId) : null) : null,
        leave_balance: parseInt(leaveBalance) || 20,
        avatar_color: avatarColor,
      };

      await api.post('/employees', payload);
      showToast(`Successfully added new ${role}: ${name}!`, 'success');

      // Reset fields
      setName('');
      setEmail('');
      setPassword('');
      setRole('employee');
      setLeaveBalance(20);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create user. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="card w-full max-w-lg bg-surface p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 border border-default my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default pb-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo/10 text-indigo mb-2 inline-block">
              Manager Action
            </span>
            <h2 className="text-xl font-extrabold text-primary">Add New Employee or Manager</h2>
            <p className="text-xs text-secondary mt-0.5">
              Create a new user account and allocate reporting manager.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary transition flex items-center justify-center font-bold text-base"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose/10 border border-rose/20 text-rose-dark dark:text-rose-light text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.morgan@leavetrack.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
            />
          </div>

          {/* Password with Eye Icon */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set password..."
                required
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition focus:outline-none text-base p-1 rounded-lg"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                User Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              >
                <option value="employee">👤 Employee</option>
                <option value="manager">👑 Manager</option>
              </select>
            </div>

            {/* Leave Balance */}
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Initial Balance (Days)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={leaveBalance}
                onChange={(e) => setLeaveBalance(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
            </div>
          </div>

          {/* Allocated Manager (for Employees) */}
          {role === 'employee' && (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Allocated Manager *
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                disabled={loadingManagers}
                className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    👑 {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Avatar Color */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider">
              Profile Avatar Color
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  className={`w-7 h-7 rounded-full transition transform ${
                    avatarColor === color ? 'scale-125 ring-2 ring-indigo ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo hover:bg-indigo-dark shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <span className="animate-spin">⏳</span>}
              <span>{submitting ? 'Creating User...' : `Add ${role === 'manager' ? 'Manager' : 'Employee'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
