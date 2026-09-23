import { useState } from 'react';

export default function TeamControlCard({ teamStats, onOpenAddUserModal }) {
  if (!teamStats) return null;

  const teamMembers = teamStats.team_members || [];

  return (
    <div className="card bg-surface p-6 rounded-3xl border border-default shadow-soft-lg space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400">
              👑 Allocated Team Control
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo">
              {teamMembers.length} Employees Under Control
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-primary mt-1">Managed Employees & Team Directory</h3>
          <p className="text-xs text-secondary">
            Employees allocated under your direct managerial supervision.
          </p>
        </div>

        <button
          onClick={onOpenAddUserModal}
          className="px-4 py-2.5 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-bold text-xs shadow-md transition duration-200 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Add Employee / Manager</span>
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="py-6 text-center text-secondary text-xs">
          No employees are currently allocated to your direct control.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teamMembers.map((emp) => (
            <div
              key={emp.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-default flex items-center gap-3 hover:border-indigo/30 transition"
            >
              <div
                className="w-10 h-10 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0"
                style={{ backgroundColor: emp.avatar_color || '#4F46E5' }}
              >
                {emp.name?.charAt(0) || 'E'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-primary truncate">{emp.name}</p>
                <p className="text-[11px] text-secondary truncate">{emp.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-emerald-dark dark:text-emerald-light bg-emerald/10 px-2 py-0.5 rounded-md">
                    🌴 {emp.leave_balance} Days Left
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
