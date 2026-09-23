export default function LeaveTrackLogo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  const dim = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`${dim} rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800
                  flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20
                  relative overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
    >
      {/* Background Emerald Accent Glow */}
      <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-400/30 rounded-full blur-sm pointer-events-none" />

      <svg
        className="w-3/5 h-3/5 text-white drop-shadow-md"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Calendar Frame */}
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeOpacity="0.85"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <line x1="3" y1="9.5" x2="21" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="7.5" cy="3.5" r="1" fill="currentColor" />
        <circle cx="16.5" cy="3.5" r="1" fill="currentColor" />

        {/* Dynamic Emerald Leave Approval Checkmark */}
        <path
          d="M7.5 15.5L10.5 18.5L16.5 12"
          stroke="#34D399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
