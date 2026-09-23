import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function PolicyHub() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // OOO Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [backupContact, setBackupContact] = useState('Bob Martinez (bob.martinez@leavetrack.com)');
  const [managerName, setManagerName] = useState(user?.manager_name || 'Sarah Chen');

  // Generated OOO text
  const oooTemplate = `Hi there,

Thank you for your email. I am currently out of the office on approved leave starting from ${startDate || '[Start Date]'} until ${endDate || '[End Date]'} with limited access to email.

If your request is urgent, please reach out to my teammate ${backupContact} or my manager ${managerName}. Otherwise, I will respond to your message as soon as possible upon my return.

Best regards,
${user?.name || 'Employee'}
${user?.role === 'manager' ? 'Team Manager' : 'Team Member'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(oooTemplate);
    showToast('Out-Of-Office email response copied to clipboard!', 'success');
  };

  const holidays = [
    { name: "New Year's Day", date: 'Jan 1, 2026', type: 'Public Holiday' },
    { name: 'Memorial Day / Spring Break', date: 'May 25, 2026', type: 'Public Holiday' },
    { name: 'Independence Day', date: 'Jul 4, 2026', type: 'Public Holiday' },
    { name: 'Labor Day', date: 'Sep 7, 2026', type: 'Public Holiday' },
    { name: 'Thanksgiving Day', date: 'Nov 26, 2026', type: 'Public Holiday' },
    { name: 'Christmas Day', date: 'Dec 25, 2026', type: 'Public Holiday' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-default pb-6">
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <span>📜</span> Company Leave Policy & OOO Assistant
        </h1>
        <p className="text-xs text-secondary mt-1">
          Auto-generate Out-Of-Office email responses and review company leave guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ================= Out-Of-Office Generator (Left Column) ================= */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between border-b border-default pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo/10 text-indigo text-base font-bold">✉️</span>
              <div>
                <h2 className="text-base font-bold text-primary">Out-Of-Office Auto-Reply Generator</h2>
                <p className="text-xs text-secondary">Customized for your leave period</p>
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="px-3.5 py-2 rounded-xl bg-indigo hover:bg-indigo-dark text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span>📋</span> Copy Response
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Leave Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-xs focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Leave End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-xs focus:outline-none focus:ring-2 focus:ring-indigo transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Backup / Urgent Contact Teammate
            </label>
            <input
              type="text"
              value={backupContact}
              onChange={(e) => setBackupContact(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-xs focus:outline-none focus:ring-2 focus:ring-indigo transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Assigned Manager
            </label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-xs focus:outline-none focus:ring-2 focus:ring-indigo transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Generated Preview</span>
              <span className="text-[11px] text-indigo font-semibold">Ready to paste into Gmail / Outlook</span>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-default text-xs text-primary font-mono whitespace-pre-wrap leading-relaxed">
              {oooTemplate}
            </pre>
          </div>
        </div>

        {/* ================= Policy Guidelines & Holidays (Right Column) ================= */}
        <div className="space-y-6">
          {/* Company Policy FAQs */}
          <div className="card space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <span>📘</span> HR Leave Policy Guidelines
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-default">
                <h3 className="text-xs font-bold text-indigo dark:text-indigo-light mb-1">
                  🌴 Annual Paid Leave Allowance
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Every full-time employee receives 20 paid leave days per calendar year. Leave accrues automatically on the 1st of each month.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-default">
                <h3 className="text-xs font-bold text-emerald-dark dark:text-emerald-light mb-1">
                  🩺 Sick Leave & Doctor's Notes
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Employees receive 10 sick leave days. Sick leave exceeding 3 consecutive business days requires a valid medical certificate upload.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-default">
                <h3 className="text-xs font-bold text-amber-dark mb-1">
                  🔄 Carryover & Expiration Rules
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  A maximum of 5 unused annual leave days can be carried over into the next calendar year. Carried-over days must be used by March 31st.
                </p>
              </div>
            </div>
          </div>

          {/* Paid Holidays Calendar */}
          <div className="card space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <span>🎉</span> Upcoming Paid Public Holidays
            </h2>

            <div className="divide-y divide-default">
              {holidays.map((h, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-primary block">{h.name}</span>
                    <span className="text-[11px] text-secondary">{h.date}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    {h.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
