import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/client';

export default function TeamCalendar() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch approved team leave for calendar
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [calRes, usersRes] = await Promise.all([
        api.get(`/team/calendar?year=${year}&month=${month}`),
        api.get('/auth/users'),
      ]);

      setCalendarEvents(calRes.data || []);

      // Filter team members who report to this manager
      const members = (usersRes.data || []).filter((u) => u.manager_id === user?.id);
      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to load team calendar data:', err);
      showToast('Failed to load team calendar', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentDate, user?.id, showToast]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = [];
  // Empty slots for preceding month
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push({ day: null, key: `empty-${i}` });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ day: d, dateStr, key: `day-${d}` });
  }

  // Check if an event matches a date (inclusive range start_date <= date <= end_date)
  const getEventsForDate = (dateStr) => {
    if (!dateStr) return [];
    return calendarEvents.filter((ev) => {
      return dateStr >= ev.start_date && dateStr <= ev.end_date;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ================= Header Controls ================= */}
      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo/10 text-indigo text-lg">🗓️</span>
            <div>
              <h1 className="text-xl font-bold text-primary">Team Leave Calendar</h1>
              <p className="text-xs text-secondary">
                Overview of approved team leave for {monthNames[month]} {year}
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-primary hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg text-primary hover:bg-surface transition font-bold"
              title="Previous Month"
            >
              ◀
            </button>
            <span className="px-4 text-sm font-bold text-primary min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg text-primary hover:bg-surface transition font-bold"
              title="Next Month"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* ================= Team Members Legend ================= */}
      <div className="card p-5">
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
          Direct Reports ({teamMembers.length})
        </h3>
        <div className="flex flex-wrap gap-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-default bg-slate-50 dark:bg-slate-800/40 text-xs font-medium"
            >
              <div
                className="w-3.5 h-3.5 rounded-full shadow-sm"
                style={{ backgroundColor: member.avatar_color || '#4F46E5' }}
              />
              <span className="text-primary font-semibold">{member.name}</span>
              <span className="text-[11px] text-secondary">({member.leave_balance} days left)</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Calendar Grid ================= */}
      <div className="card p-4 sm:p-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-secondary text-sm">
            <span className="animate-spin inline-block mr-2">⏳</span> Loading team calendar...
          </div>
        ) : (
          <div>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-secondary uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
              {daysGrid.map((item) => {
                if (!item.day) {
                  return (
                    <div
                      key={item.key}
                      className="min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl bg-slate-50/30 dark:bg-slate-900/20 border border-transparent"
                    />
                  );
                }

                const dayEvents = getEventsForDate(item.dateStr);
                const isToday = item.dateStr === todayStr;

                return (
                  <div
                    key={item.key}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl border transition flex flex-col justify-between ${
                      isToday
                        ? 'border-indigo bg-indigo/5 dark:bg-indigo/10 shadow-sm'
                        : 'border-default bg-surface hover:border-indigo/30'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold rounded-lg w-6 h-6 flex items-center justify-center ${
                          isToday ? 'bg-indigo text-white shadow-sm' : 'text-primary'
                        }`}
                      >
                        {item.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo bg-indigo/10 px-1.5 py-0.5 rounded-full">
                          {dayEvents.length} on leave
                        </span>
                      )}
                    </div>

                    {/* Event Chips */}
                    <div className="space-y-1 overflow-y-auto max-h-[70px]">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-white truncate shadow-xs cursor-pointer hover:opacity-90 transition flex items-center gap-1"
                          style={{ backgroundColor: ev.avatar_color || '#4F46E5' }}
                          title={`${ev.employee_name}: ${ev.reason}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                          <span className="truncate">{ev.employee_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= Event Detail Popover / Modal ================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm bg-surface p-6 rounded-2xl shadow-2xl border border-default space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedEvent.avatar_color || '#4F46E5' }}
                >
                  {selectedEvent.employee_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">{selectedEvent.employee_name}</h3>
                  <p className="text-xs text-secondary">Approved Leave</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-secondary hover:text-primary font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-default text-xs space-y-2">
              <div className="flex justify-between text-secondary">
                <span>Duration:</span>
                <span className="font-semibold text-primary">{selectedEvent.start_date} → {selectedEvent.end_date}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Reason:</span>
                <span className="font-semibold text-primary italic">"{selectedEvent.reason}"</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo text-white hover:bg-indigo-dark transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
