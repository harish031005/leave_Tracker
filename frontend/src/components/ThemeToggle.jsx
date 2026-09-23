/**
 * ThemeToggle — a sun/moon toggle button for switching between light and dark mode.
 * Uses CSS transitions for a smooth icon swap animation.
 */

import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800
                 flex items-center justify-center
                 transition-all duration-300 hover:scale-110 hover:shadow-glow
                 focus:outline-none focus:ring-2 focus:ring-indigo/30"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon (shown in dark mode) */}
      <svg
        className={`w-5 h-5 text-amber transition-all duration-300 absolute
                    ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>

      {/* Moon icon (shown in light mode) */}
      <svg
        className={`w-5 h-5 text-indigo transition-all duration-300 absolute
                    ${isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}
