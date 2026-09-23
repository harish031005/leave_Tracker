import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import LeaveTrackLogo from '../components/Logo';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available demo users on mount
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const res = await api.get('/auth/users');
        setDemoUsers(res.data || []);
      } catch (err) {
        console.error('Failed to load demo users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  const handleLogin = async (e, customEmail = null, customPass = null) => {
    if (e) e.preventDefault();
    setError('');

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail || !targetPass) {
      setError('Please provide email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(targetEmail, targetPass);
      showToast(`Welcome back, ${loggedUser.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please check your login details.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSelect = (userEmail) => {
    if (!userEmail) return;
    setEmail(userEmail);
    setPassword('password123');
    handleLogin(null, userEmail, 'password123');
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <LeaveTrackLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">LeaveTrack</h1>
          <p className="text-sm text-secondary mt-1">Smart Leave & PTO Management</p>
        </div>

        {/* Card */}
        <div className="card backdrop-blur-md bg-surface/95 border border-default shadow-soft-lg p-8 rounded-3xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose/10 border border-rose/20 text-rose-dark dark:text-rose-light text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Login Selector */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo/5 border border-indigo/15">
            <label className="block text-xs font-bold text-indigo dark:text-indigo-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🚀</span> Quick Demo Login
            </label>
            <select
              id="demo-user-select"
              onChange={(e) => handleDemoSelect(e.target.value)}
              defaultValue=""
              className="w-full px-3.5 py-2.5 rounded-xl border border-indigo/20 bg-surface text-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo transition cursor-pointer"
            >
              <option value="" disabled>Select a demo profile to test...</option>
              {demoUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} ({u.role.toUpperCase()}) — {u.email}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-secondary mt-2 italic">
              All demo accounts password: <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-primary font-mono">password123</code>
            </p>
          </div>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-default"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-secondary uppercase tracking-widest">
              Or Login Manually
            </span>
            <div className="flex-grow border-t border-default"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
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

            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-indigo hover:bg-indigo-dark text-white shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {submitting && <span className="animate-spin">⏳</span>}
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-secondary mt-6">
          LeaveTrack System • Built for Team Productivity
        </p>
      </div>
    </div>
  );
}
