import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TodoList from './pages/TodoList';
import PolicyHub from './pages/PolicyHub';
import TeamCalendar from './pages/TeamCalendar';

// Protected Route component (requires logged in user)
function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center text-primary">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-2xl">⏳</span>
          <span className="text-sm font-semibold">Loading LeaveTrack...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (managerOnly && user.role !== 'manager') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Redirect logged-in users away from /login
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public login route */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* My ID Card & Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Things To Do checklist */}
              <Route
                path="/todo"
                element={
                  <ProtectedRoute>
                    <TodoList />
                  </ProtectedRoute>
                }
              />

              {/* Policy & OOO Hub */}
              <Route
                path="/policy-hub"
                element={
                  <ProtectedRoute>
                    <PolicyHub />
                  </ProtectedRoute>
                }
              />

              {/* Manager team calendar */}
              <Route
                path="/team-calendar"
                element={
                  <ProtectedRoute managerOnly={true}>
                    <TeamCalendar />
                  </ProtectedRoute>
                }
              />

              {/* Default fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
