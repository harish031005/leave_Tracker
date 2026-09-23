import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function TodoList() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Initial default checklist tasks
  const defaultTasks = [
    { id: 1, text: 'Submit upcoming leave application on LeaveTrack', priority: 'high', category: 'Leave Prep', completed: false },
    { id: 2, text: `Confirm leave dates with Manager (${user?.role === 'manager' ? 'Direct Reports' : (user?.manager_name || 'Sarah Chen')})`, priority: 'high', category: 'Leave Prep', completed: true },
    { id: 3, text: 'Draft Out-of-Office (OOO) email response', priority: 'medium', category: 'Handover', completed: false },
    { id: 4, text: 'Set Slack/Teams status to Out of Office during vacation', priority: 'medium', category: 'Handover', completed: false },
    { id: 5, text: 'Complete code review for pending pull requests', priority: 'low', category: 'Work Tasks', completed: true },
  ];

  const storageKey = `leavetrack_todos_${user?.id}`;

  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse todos from localStorage:', e);
      }
    }
    return defaultTasks;
  });

  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('Leave Prep');

  // Save to localStorage when todos change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(todos));
  }, [todos, storageKey]);

  // Add task
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newTask = {
      id: Date.now(),
      text: newText.trim(),
      priority: newPriority,
      category: newCategory,
      completed: false,
    };

    setTodos([newTask, ...todos]);
    setNewText('');
    showToast('Task added to your Things To Do list!', 'success');
  };

  // Toggle completed
  const toggleTodo = (id) => {
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Delete task
  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
    showToast('Task removed.', 'info');
  };

  // Metrics
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered list
  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose/10 text-rose-dark dark:text-rose-light border-rose/20';
      case 'medium':
        return 'bg-amber/10 text-amber-dark border-amber/20';
      default:
        return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl border-none shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-purple-200">
                ✅ Productivity Hub
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Things To Do</h1>
            <p className="text-xs text-purple-200 mt-1 max-w-lg">
              Stay organized before going on leave. Track handovers, approvals, and key tasks.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl min-w-[200px] text-center">
            <span className="text-xs text-purple-200 font-semibold uppercase tracking-wider block">Task Completion</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{progressPercent}%</span>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-purple-200 mt-1.5 block">
              {completedCount} of {totalCount} tasks completed
            </span>
          </div>
        </div>
      </div>

      {/* Add Task Form & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Add Task Panel */}
        <div className="lg:col-span-1 card space-y-4">
          <h2 className="text-base font-bold text-primary flex items-center gap-2">
            <span>➕</span> Add New Task
          </h2>

          <form onSubmit={handleAddTodo} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                Task Description
              </label>
              <textarea
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. Schedule handover sync with teammate..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo transition"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-default bg-slate-50 dark:bg-slate-900 text-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo transition"
                >
                  <option value="Leave Prep">Leave Prep</option>
                  <option value="Handover">Handover</option>
                  <option value="Work Tasks">Work Tasks</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-bold text-xs shadow-md transition"
            >
              Add Task to List
            </button>
          </form>
        </div>

        {/* Task List Panel */}
        <div className="lg:col-span-2 card space-y-4">
          {/* Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-4">
            <div>
              <h2 className="text-base font-bold text-primary">Checklist ({filteredTodos.length})</h2>
              <p className="text-xs text-secondary">Click any task to toggle completed status</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {['all', 'active', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    filter === tab
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Task Items */}
          {filteredTodos.length === 0 ? (
            <div className="py-12 text-center text-secondary space-y-2">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-semibold text-primary">No tasks in this view!</p>
              <p className="text-xs">You are all caught up.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                    todo.completed
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-default opacity-60'
                      : 'bg-surface border-default hover:border-indigo/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="w-5 h-5 rounded-md text-indigo focus:ring-indigo cursor-pointer transition"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold transition ${
                        todo.completed ? 'line-through text-secondary' : 'text-primary'
                      }`}>
                        {todo.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        <span className="text-[11px] text-secondary font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {todo.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-secondary hover:text-rose p-1.5 rounded-lg hover:bg-rose/10 transition text-xs font-bold"
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
