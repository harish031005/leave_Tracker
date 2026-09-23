import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/client';
import LeaveBalanceChart from '../components/LeaveBalanceChart';
import LeaveModal from '../components/LeaveModal';
import AuditModal from '../components/AuditModal';
import AddUserModal from '../components/AddUserModal';
import TeamControlCard from '../components/TeamControlCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [myRequests, setMyRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [userProfile, setUserProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  // Tab states
  const [scopeTab, setScopeTab] = useState(user?.role === 'manager' ? 'team' : 'my'); // 'my' or 'team'
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState(null);

  // Review modal (Manager action)
  const [reviewRequest, setReviewRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch current profile to get latest balance & manager details
      const meRes = await api.get('/employees/me');
      setUserProfile(meRes.data);

      // 2. Fetch personal leave requests
      const myRequestsRes = await api.get('/leave-requests?scope=my');
      setMyRequests(myRequestsRes.data || []);

      // 3. If manager, fetch team leave requests & team stats
      if (meRes.data?.role === 'manager' || user?.role === 'manager') {
        const teamRequestsRes = await api.get('/leave-requests?scope=team');
        setTeamRequests(teamRequestsRes.data || []);

        const statsRes = await api.get('/team/stats');
        setTeamStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.role, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Employee Cancel Request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

    try {
      await api.put(`/leave-requests/${requestId}/cancel`);
      showToast('Leave request cancelled', 'info');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel leave request.';
      showToast(msg, 'error');
    }
  };

  // Open Review Dialog for Manager
  const openReviewDialog = (req, actionType) => {
    setReviewRequest(req);
    setReviewAction(actionType);
    setReviewNote('');
  };

  // Execute Review Action (Approve / Reject)
  const handleExecuteReview = async () => {
    if (!reviewRequest || !reviewAction) return;
    setReviewSubmitting(true);

    try {
      const url = `/leave-requests/${reviewRequest.id}/${reviewAction}`;
      await api.put(url, { note: reviewNote.trim() });

      showToast(
        `Leave request #${reviewRequest.id} ${reviewAction === 'approve' ? 'approved' : 'rejected'}!`,
        reviewAction === 'approve' ? 'success' : 'info'
      );
      setReviewRequest(null);
      setReviewAction(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${reviewAction} leave request.`;
      showToast(msg, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Compute stat metrics
  const currentBalance = userProfile?.leave_balance ?? 20;
  const totalAllowance = 20;
  const usedDays = totalAllowance - currentBalance;
  const managerName = userProfile?.manager_name || 'Sarah Chen';

  const isManager = userProfile?.role === 'manager';

  // Target request list based on scopeTab ('my' vs 'team')
  const currentRequestList = (isManager && scopeTab === 'team') ? teamRequests : myRequests;

  // Filter requests based on active status tab
  const filteredRequests = currentRequestList.filter((req) => {
    if (activeStatusTab === 'all') return true;
    return req.status === activeStatusTab;
  });

  // Count metrics
  const myPendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const myApprovedCount = myRequests.filter((r) => r.status === 'approved').length;
  const teamPendingCount = teamRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ================= Header Banner ================= */}
      <div className="card bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 rounded-3xl border-none shadow-xl relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-indigo-200">
                {isManager ? '👑 Manager Workspace' : '👤 Employee Portal'}
              </span>

              {/* MANAGER NAME BADGE */}
              {!isManager && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md flex items-center gap-1.5">
                  <span>👑 Manager:</span>
                  <span className="text-white font-extrabold">{managerName}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {userProfile?.name}!
            </h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-lg">
              {isManager
                ? 'Manage team leave requests, review history, and control assigned employees.'
                : `Assigned Manager: ${managerName} • Track leave balance and status updates.`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isManager && (
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-5 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg hover:shadow-xl transition duration-200 flex items-center gap-2"
              >
                <span>➕</span>
                <span>Add User</span>
              </button>
            )}

            <button
              id="apply-leave-btn"
              onClick={() => setIsApplyModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <span className="text-base">➕</span>
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= Manager Info Strip for Employees ================= */}
      {!isManager && (
        <div className="card p-4 bg-indigo/5 border border-indigo/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              👑
            </div>
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Assigned Reporting Manager</p>
              <p className="text-sm font-extrabold text-primary">{managerName}</p>
            </div>
          </div>
          <span className="text-xs text-secondary italic">
            Leave approvals for your applications are reviewed by {managerName}
          </span>
        </div>
      )}

      {/* ================= Stats Grid & Balance Chart ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stat Cards Column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Available Balance */}
          <div className="card flex flex-col justify-between border-l-4 border-l-indigo hover:shadow-soft-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Remaining Balance</span>
              <span className="p-2 rounded-xl bg-indigo/10 text-indigo text-lg">🌴</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-primary">{currentBalance}</span>
              <span className="text-sm text-secondary font-medium ml-1">/ {totalAllowance} days</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-indigo h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentBalance / totalAllowance) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 2: Used Days */}
          <div className="card flex flex-col justify-between border-l-4 border-l-emerald hover:shadow-soft-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Used Leave</span>
              <span className="p-2 rounded-xl bg-emerald/10 text-emerald-dark dark:text-emerald-light text-lg">✅</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-primary">{usedDays}</span>
              <span className="text-sm text-secondary font-medium ml-1">days taken</span>
            </div>
            <p className="text-xs text-secondary mt-4">Approved time off this year</p>
          </div>

          {/* Card 3: Pending Requests */}
          <div className="card flex flex-col justify-between border-l-4 border-l-amber hover:shadow-soft-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">My Pending Requests</span>
              <span className="p-2 rounded-xl bg-amber/10 text-amber-dark text-lg">⏳</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-primary">{myPendingCount}</span>
              <span className="text-sm text-secondary font-medium ml-1">requests</span>
            </div>
            <p className="text-xs text-secondary mt-4">Awaiting manager decision</p>
          </div>

          {/* Card 4: Manager Team Overview (if manager) or Total Approved */}
          {isManager && teamStats ? (
            <div className="card flex flex-col justify-between border-l-4 border-l-purple-600 hover:shadow-soft-lg transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Team Pending</span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 text-lg">👥</span>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-primary">{teamStats.pending_requests}</span>
                <span className="text-sm text-secondary font-medium ml-1">to review</span>
              </div>
              <p className="text-xs text-secondary mt-4">Direct reports: {teamStats.total_team_members} employees</p>
            </div>
          ) : (
            <div className="card flex flex-col justify-between border-l-4 border-l-indigo-400 hover:shadow-soft-lg transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Approved</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo text-lg">🗓️</span>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-primary">{myApprovedCount}</span>
                <span className="text-sm text-secondary font-medium ml-1">applications</span>
              </div>
              <p className="text-xs text-secondary mt-4">All-time approved requests</p>
            </div>
          )}
        </div>

        {/* Donut Chart Component */}
        <div className="lg:col-span-1">
          <LeaveBalanceChart balance={currentBalance} total={totalAllowance} />
        </div>
      </div>

      {/* ================= Manager's Team Control Directory ================= */}
      {isManager && (
        <TeamControlCard
          teamStats={teamStats}
          onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
        />
      )}

      {/* ================= Leave Requests Section ================= */}
      <div className="card space-y-6">
        {/* Table Header & Scope Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-5">
          <div>
            {/* Main Category Tabs for Manager (My Applications vs Team Applications) */}
            {isManager ? (
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setScopeTab('team')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                    scopeTab === 'team'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary'
                  }`}
                >
                  <span>👥 Team Applications</span>
                  {teamPendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose text-white">
                      {teamPendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setScopeTab('my')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                    scopeTab === 'my'
                      ? 'bg-indigo text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary'
                  }`}
                >
                  <span>👤 My Applications</span>
                </button>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-primary">My Leave Applications</h2>
            )}

            <p className="text-xs text-secondary">
              {scopeTab === 'team' && isManager
                ? 'Applications submitted by employees under your direct management.'
                : 'Your personal leave applications and audit status history.'}
            </p>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStatusTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  activeStatusTab === tab
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="py-12 text-center text-secondary text-sm">
            <span className="animate-spin inline-block mr-2">⏳</span> Loading leave requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-4xl">📭</span>
            <p className="text-sm font-semibold text-primary">No leave requests found</p>
            <p className="text-xs text-secondary">
              There are no {activeStatusTab !== 'all' ? activeStatusTab : ''} applications in this view.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-default text-xs font-semibold text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default text-sm">
                {filteredRequests.map((req) => {
                  const isOwnRequest = req.employee_id === userProfile?.id;
                  const canManagerReview = isManager && !isOwnRequest && req.status === 'pending';
                  const canEmployeeCancel = isOwnRequest && req.status === 'pending';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      {/* Applicant */}
                      <td className="py-4 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo/10 text-indigo flex items-center justify-center font-bold text-xs">
                            {req.employee_name?.charAt(0) || 'U'}
                          </div>
                          <span>{req.employee_name || `Employee #${req.employee_id}`}</span>
                          {isOwnRequest && (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-secondary font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 text-secondary text-xs">
                        <div className="font-semibold text-primary">{req.start_date} → {req.end_date}</div>
                        <div className="text-[11px] text-secondary mt-0.5">
                          Requested on {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-4 text-primary max-w-xs truncate">
                        {req.reason}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          req.status === 'approved' ? 'badge-approved' :
                          req.status === 'rejected' ? 'badge-rejected' :
                          req.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'
                        }`}>
                          {req.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Audit Trail Button */}
                          <button
                            onClick={() => setSelectedAuditRequest(req)}
                            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1"
                            title="View Audit Trail"
                          >
                            <span>📜</span>
                            <span className="hidden sm:inline">Audit</span>
                          </button>

                          {/* Manager Review Actions */}
                          {canManagerReview && (
                            <>
                              <button
                                onClick={() => openReviewDialog(req, 'approve')}
                                className="px-3 py-1.5 rounded-xl bg-emerald/10 hover:bg-emerald/20 text-emerald-dark dark:text-emerald-light text-xs font-bold transition flex items-center gap-1"
                              >
                                <span>✓</span> Approve
                              </button>
                              <button
                                onClick={() => openReviewDialog(req, 'reject')}
                                className="px-3 py-1.5 rounded-xl bg-rose/10 hover:bg-rose/20 text-rose-dark dark:text-rose-light text-xs font-bold transition flex items-center gap-1"
                              >
                                <span>✕</span> Reject
                              </button>
                            </>
                          )}

                          {/* Employee Cancel Action */}
                          {canEmployeeCancel && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose/20 hover:text-rose-dark text-secondary text-xs font-semibold transition"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= Modals ================= */}
      {/* Apply Leave Modal */}
      <LeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={fetchData}
        currentBalance={currentBalance}
      />

      {/* Add User Modal for Managers */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Audit Log Modal */}
      <AuditModal
        isOpen={!!selectedAuditRequest}
        onClose={() => setSelectedAuditRequest(null)}
        request={selectedAuditRequest}
      />

      {/* Manager Review Modal (Approve / Reject Dialog) */}
      {reviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md bg-surface p-6 rounded-2xl shadow-2xl space-y-4 border border-default">
            <h3 className="text-lg font-bold text-primary capitalize flex items-center gap-2">
              <span>{reviewAction === 'approve' ? '✅' : '❌'}</span>
              <span>{reviewAction} Leave Request #{reviewRequest.id}</span>
            </h3>

            <p className="text-xs text-secondary">
              Applicant: <span className="font-semibold text-primary">{reviewRequest.employee_name}</span> ({reviewRequest.start_date} → {reviewRequest.end_date})
            </p>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Optional Reviewer Note
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={reviewAction === 'approve' ? 'e.g. Approved. Have a great vacation!' : 'e.g. Rejected due to critical project deadline...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReviewRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReview}
                disabled={reviewSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 flex items-center gap-1.5 ${
                  reviewAction === 'approve' ? 'bg-emerald hover:bg-emerald-dark' : 'bg-rose hover:bg-rose-dark'
                }`}
              >
                {reviewSubmitting && <span className="animate-spin">⏳</span>}
                <span className="capitalize">Confirm {reviewAction}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
