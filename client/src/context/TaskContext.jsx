// Shared task state for all pages.
// It loads tasks from the API and gives functions to add, edit, delete and change status.
// It also controls the Add/Edit sheet, so any page can open it.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as api from '../api';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0); // goes up after each change (Search page uses it)

  // Sheet state: open or closed, the task to edit (null = new task), and the default date
  const [sheet, setSheet] = useState({ open: false, task: null, date: null });

  // Load all tasks one time when the app starts
  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const changed = () => setVersion((v) => v + 1);

  async function addTask(data) {
    const task = await api.createTask(data);
    setTasks((list) => [...list, task]);
    changed();
  }

  async function editTask(id, data) {
    const task = await api.updateTask(id, data);
    setTasks((list) => list.map((t) => (t._id === id ? task : t)));
    changed();
  }

  async function removeTask(id) {
    await api.deleteTask(id);
    setTasks((list) => list.filter((t) => t._id !== id));
    changed();
  }

  // Completed <-> In Progress
  function toggleStatus(task) {
    const status = task.status === 'Completed' ? 'In Progress' : 'Completed';
    return editTask(task._id, { status });
  }

  const openSheet = (task = null, date = null) => setSheet({ open: true, task, date });
  const closeSheet = () => setSheet((s) => ({ ...s, open: false }));

  // Details drawer (read-only view of one task). We keep only the id and
  // read the task from the list, so the drawer updates when the task changes.
  const [detailsId, setDetailsId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsTask = tasks.find((t) => t._id === detailsId) || null;
  const openDetails = (task) => {
    setDetailsId(task._id);
    setDetailsOpen(true);
  };
  const closeDetails = () => setDetailsOpen(false);

  // Small message at the bottom of the screen (for example an API error)
  const [toast, setToast] = useState('');
  const notify = useCallback((message) => setToast(message), []); // stable, safe in effect deps
  const closeToast = () => setToast('');

  // Confirm dialog. confirm() opens it and returns a Promise.
  // The Promise gets true or false when the user taps Delete or Cancel.
  const [confirmState, setConfirmState] = useState({ open: false });
  const resolver = useRef(null);

  function confirm({ title, message, confirmText = 'Delete' }) {
    setConfirmState({ open: true, title, message, confirmText });
    return new Promise((resolve) => (resolver.current = resolve));
  }

  function answerConfirm(answer) {
    setConfirmState((s) => ({ ...s, open: false }));
    resolver.current?.(answer);
  }

  const value = {
    tasks, loading, error, version,
    addTask, editTask, removeTask, toggleStatus,
    sheet, openSheet, closeSheet,
    detailsTask, detailsOpen, openDetails, closeDetails,
    toast, notify, closeToast,
    confirmState, confirm, answerConfirm,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

// Hook to use the shared state in any component
export const useTasks = () => useContext(TaskContext);
