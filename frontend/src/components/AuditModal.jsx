export default function AuditModal({ isOpen, onClose, request }) {
  if (!isOpen || !request) return null;

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'bg-indigo/10 text-indigo border-indigo/20';
      case 'approved':
        return 'bg-emerald/10 text-emerald-dark dark:text-emerald-light border-emerald/20';
      case 'rejected':
        return 'bg-rose/10 text-rose-dark dark:text-rose-light border-rose/20';
      case 'cancelled':
        return 'bg-slate-200 dark:bg-slate-700 text-slate border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return '📝';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return 'ℹ️';
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const dt = new Date(isoStr);
    return dt.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg shadow-2xl border border-default bg-surface rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo/10 text-indigo flex items-center justify-center font-bold text-lg">
              📜
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Audit Trail History</h2>
              <p className="text-xs text-secondary">
                Request #{request.id} • {request.employee_name || 'Employee'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary text-xl font-bold p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Request Brief */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-default space-y-2">
            <div className="flex justify-between items-center text-xs text-secondary font-medium">
              <span>Dates: {request.start_date} → {request.end_date}</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                request.status === 'approved' ? 'badge-approved' :
                request.status === 'rejected' ? 'badge-rejected' :
                request.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'
              }`}>
                {request.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-primary">
              "{request.reason}"
            </p>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">
              Activity Log ({request.audit_trail?.length || 0} events)
            </h3>

            {(!request.audit_trail || request.audit_trail.length === 0) ? (
              <p className="text-sm text-secondary italic">No audit events recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {request.audit_trail.map((log) => (
                  <div key={log.id} className="relative flex items-start gap-3 group">
                    {/* Icon node */}
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${getActionColor(log.action)} shadow-sm`}>
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-default p-3.5 rounded-xl transition hover:shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-primary capitalize">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-secondary">
                        Performed by: <span className="font-semibold text-primary">{log.performer_name || `User #${log.performed_by}`}</span>
                      </p>
                      {log.note && (
                        <div className="mt-2 text-xs italic bg-surface p-2 rounded-lg border border-default text-primary">
                          "{log.note}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-default bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-primary transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
