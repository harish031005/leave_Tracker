import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isFlipped, setIsFlipped] = useState(false);

  // Editable personal details (persisted in localStorage for demo)
  const [details, setDetails] = useState({
    phone: '+1 (555) 234-5678',
    emergencyContact: 'Michael Johnson (Spouse)',
    emergencyPhone: '+1 (555) 987-6543',
    department: user?.role === 'manager' ? 'Management & Strategy' : 'Product Engineering',
    location: 'San Francisco HQ • Hybrid',
    bio: 'Dedicated team member focused on building scalable software solutions.',
  });

  const [saving, setSaving] = useState(false);

  // Load saved details from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`leavetrack_profile_${user?.id}`);
    if (saved) {
      try {
        setDetails(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved profile details:', e);
      }
    }
  }, [user?.id]);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem(`leavetrack_profile_${user?.id}`, JSON.stringify(details));
      setSaving(false);
      showToast('Personal details updated successfully!', 'success');
    }, 400);
  };

  const empIdFormatted = `EMP-${String(user?.id || 1).padStart(4, '0')}`;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <span>🪪</span> My ID Card & Personal Profile
          </h1>
          <p className="text-xs text-secondary mt-1">
            View your official digital employee badge and manage contact details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2.5 rounded-xl bg-indigo/10 hover:bg-indigo/20 text-indigo dark:text-indigo-light text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <span>🔄</span>
            <span>{isFlipped ? 'Show Front Side' : 'Flip to Back Side'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ================= Digital ID Card (Left Column) ================= */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">
            Official Digital ID Card
          </h2>

          {/* Interactive 3D Card Container */}
          <div className="relative group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`w-full min-h-[420px] rounded-3xl p-6 transition-all duration-500 transform shadow-2xl relative overflow-hidden flex flex-col justify-between ${
              isFlipped
                ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white'
                : 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white'
            }`}>
              {/* Card Pattern Background */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              {!isFlipped ? (
                /* FRONT SIDE */
                <>
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white text-indigo-900 font-extrabold text-sm flex items-center justify-center shadow-md">
                        LT
                      </div>
                      <div>
                        <span className="font-extrabold text-sm tracking-tight block">LeaveTrack</span>
                        <span className="text-[9px] uppercase tracking-widest text-indigo-200 block">Verified Pass</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ● Active
                    </span>
                  </div>

                  {/* Card Center — Avatar & User Info */}
                  <div className="my-6 text-center space-y-3">
                    <div
                      className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-extrabold ring-4 ring-white/30 shadow-xl"
                      style={{ backgroundColor: user?.avatar_color || '#4F46E5' }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{user?.name}</h3>
                      <p className="text-xs text-indigo-200 capitalize font-medium">{details.department}</p>
                    </div>

                    <div className="inline-block px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
                      {user?.role === 'manager' ? '👑 Team Manager' : '👤 Employee'}
                    </div>
                  </div>

                  {/* Card Footer Details */}
                  <div className="pt-4 border-t border-white/15 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-indigo-200">
                      <span>Employee ID:</span>
                      <span className="font-mono font-bold text-white">{empIdFormatted}</span>
                    </div>

                    {/* MANAGER NAME DISPLAY */}
                    <div className="flex justify-between items-center text-indigo-200">
                      <span>Assigned Manager:</span>
                      <span className="font-bold text-white">
                        {user?.role === 'manager' ? 'Self (Manager)' : (user?.manager_name || 'Sarah Chen')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-indigo-200">
                      <span>Leave Balance:</span>
                      <span className="font-extrabold text-emerald-300">{user?.leave_balance ?? 20} Days Remaining</span>
                    </div>
                  </div>
                </>
              ) : (
                /* BACK SIDE */
                <>
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <span className="font-bold text-xs uppercase tracking-wider text-indigo-200">Security & Access</span>
                    <span className="text-[10px] text-white/60">ID: {empIdFormatted}</span>
                  </div>

                  {/* QR Code Simulation */}
                  <div className="my-6 text-center space-y-3">
                    <div className="w-36 h-36 bg-white p-2.5 rounded-2xl mx-auto shadow-inner flex flex-col items-center justify-center">
                      <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 bg-slate-100 rounded-lg">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-xs ${
                              (i % 2 === 0 || i % 5 === 0) ? 'bg-slate-900' : 'bg-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-200">Scan for Instant Verification</p>
                  </div>

                  <div className="pt-4 border-t border-white/15 text-center text-xs text-indigo-200 space-y-1">
                    <p>Contact: {user?.email}</p>
                    <p className="text-[10px] text-white/50">Issued by LeaveTrack HR Platform</p>
                  </div>
                </>
              )}
            </div>
            <p className="text-[11px] text-center text-secondary mt-2 italic">
              💡 Click card to flip between front and back views
            </p>
          </div>
        </div>

        {/* ================= Personal Details & Settings (Right Column) ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Card */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between border-b border-default pb-4">
              <div>
                <h2 className="text-base font-bold text-primary">Personal & Work Details</h2>
                <p className="text-xs text-secondary">Manage your contact details and department information</p>
              </div>
              <span className="text-xs font-bold text-indigo bg-indigo/10 px-3 py-1 rounded-full">
                {empIdFormatted}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Manager Display Alert */}
              <div className="p-4 rounded-xl bg-indigo/5 border border-indigo/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo/10 text-indigo flex items-center justify-center font-bold">
                    👑
                  </div>
                  <div>
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider block">
                      Reporting Manager
                    </span>
                    <span className="text-sm font-extrabold text-indigo dark:text-indigo-light">
                      {user?.role === 'manager' ? 'You are a Team Manager' : (user?.manager_name || 'Sarah Chen')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold bg-surface px-3 py-1 rounded-lg border border-default text-primary">
                  {user?.role?.toUpperCase()}
                </span>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-100 dark:bg-slate-800 text-secondary text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-100 dark:bg-slate-800 text-secondary text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    Department
                  </label>
                  <input
                    type="text"
                    value={details.department}
                    onChange={(e) => setDetails({ ...details, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    Emergency Contact Person
                  </label>
                  <input
                    type="text"
                    value={details.emergencyContact}
                    onChange={(e) => setDetails({ ...details, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={details.emergencyPhone}
                    onChange={(e) => setDetails({ ...details, emergencyPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                  Work Location
                </label>
                <input
                  type="text"
                  value={details.location}
                  onChange={(e) => setDetails({ ...details, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <span className="animate-spin">⏳</span>}
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Entitlements Breakdown */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
              Annual Leave Entitlements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-indigo/5 border border-indigo/10">
                <span className="text-xl font-extrabold text-indigo block">20</span>
                <span className="text-[11px] text-secondary font-semibold">Annual PTO</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald/5 border border-emerald/10">
                <span className="text-xl font-extrabold text-emerald-dark dark:text-emerald-light block">10</span>
                <span className="text-[11px] text-secondary font-semibold">Sick Days</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber/5 border border-amber/10">
                <span className="text-xl font-extrabold text-amber-dark block">5</span>
                <span className="text-[11px] text-secondary font-semibold">Casual Days</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                <span className="text-xl font-extrabold text-purple-600 block">12</span>
                <span className="text-[11px] text-secondary font-semibold">Public Holidays</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
