import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import LeaveTrackLogo from './Logo';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build navigation links based on role
  const baseLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/profile', label: 'My ID Card & Profile', icon: UserCardIcon },
    { to: '/todo', label: 'Things To Do', icon: TodoIcon },
    { to: '/policy-hub', label: 'Policy & OOO Hub', icon: PolicyIcon },
  ];

  const navLinks = user?.role === 'manager'
    ? [
        ...baseLinks,
        { to: '/team-calendar', label: 'Team Calendar', icon: CalendarIcon },
      ]
    : baseLinks;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-page transition-colors duration-300">
      {/* ============= Fixed Non-Scrolling Sidebar ============= */}
      <aside className="w-64 flex-shrink-0 h-screen bg-surface border-r border-default
                        flex flex-col justify-between transition-colors duration-300 z-20">
        {/* Logo Header (Fixed Top) */}
        <div className="px-6 py-6 border-b border-default shrink-0">
          <div className="flex items-center gap-3">
            <LeaveTrackLogo size="md" />
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight">LeaveTrack</h1>
              <p className="text-[10px] text-secondary uppercase tracking-widest font-semibold">
                HR & PTO Suite
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links (Scrolls internally if viewport is small) */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold
                 transition-all duration-200
                 ${isActive
                   ? 'bg-indigo/10 text-indigo dark:text-indigo-light shadow-sm border border-indigo/20'
                   : 'text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-primary'
                 }`
              }
            >
              <link.icon />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Details & Sign Out Button (Fixed Bottom) */}
        <div className="px-4 py-4 border-t border-default space-y-3 shrink-0 bg-surface">
          {user?.role === 'employee' && user?.manager_name && (
            <div className="px-3 py-2 rounded-xl bg-indigo/5 border border-indigo/10 flex items-center gap-2">
              <span className="text-xs">👑</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Reports to Manager</p>
                <p className="text-xs font-bold text-indigo dark:text-indigo-light truncate">{user.manager_name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: user?.avatar_color || '#4F46E5' }}
            >
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary truncate">{user?.name}</p>
              <p className="text-[11px] text-secondary capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs
                       bg-rose/10 hover:bg-rose/20 text-rose-dark dark:text-rose-light border border-rose/20
                       transition-all duration-200 font-extrabold shadow-sm cursor-pointer"
          >
            <LogoutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============= Main Scrollable Content ============= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Fixed Header Bar */}
        <header className="h-16 shrink-0 px-8 flex items-center justify-between
                          bg-surface border-b border-default
                          transition-colors duration-300 z-10">
          <div className="flex items-center gap-3">
            <p className="text-xs text-secondary font-medium">
              Welcome back, <span className="text-primary font-bold text-sm">{user?.name}</span>
            </p>
            {user?.role === 'employee' && user?.manager_name && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo/10 text-indigo dark:text-indigo-light flex items-center gap-1">
                <span>👑 Manager:</span>
                <span className="font-bold">{user.manager_name}</span>
              </span>
            )}
            {user?.role === 'manager' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                👑 Team Manager
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
          {children}

          {/* End of Page Footer */}
          <footer className="mt-12 pt-6 border-t border-default text-center sm:text-left text-xs text-secondary">
            <p>© {new Date().getFullYear()} LeaveTrack System • Smart Leave & PTO Management</p>
          </footer>
        </div>
      </main>
    </div>
  );
}


/* ===================================================================
   SVG Icon Components
   =================================================================== */

function DashboardIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function UserCardIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 9h.01M15 12h.01M15 15h.01M18 9h.01M18 12h.01M18 15h.01M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function TodoIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PolicyIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}
