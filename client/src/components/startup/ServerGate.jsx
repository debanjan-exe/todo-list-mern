// Runs FIRST when the app opens. It asks the server for its status (GET /api/health)
// and shows the StartupScreen with one row per check:
//   Server · Database · Sign in · Test account
// When the server and database are up, it fades out and shows the app ("children").
// When something is down, it shows the reason and tries again every 5 seconds
// (or at once with the "Try again" button).
//
// ONCE PER SESSION: after a successful check we save a flag in sessionStorage.
// Reloads in the same tab skip this screen. A new tab or a new browser session shows it again.
import { useCallback, useEffect, useRef, useState } from 'react';
import StartupScreen from './StartupScreen';
import { getHealth } from '../../api';

const MIN_SHOW_MS = 1400; // show the screen at least this long, so it does not just flash
const RETRY_SECONDS = 5;
const SHOW_OK_MS = 700; // show the green "all ready" rows for a moment
const LEAVE_MS = 450; // fade-out time (same as in StartupScreen)

const SESSION_KEY = 'todo_server_checked';

// sessionStorage can throw (for example in some private modes), so wrap it
function checkedThisSession() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}
function rememberChecked() {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
}

const LABELS = { api: 'Server', database: 'Database', auth: 'Sign in', testUser: 'Test account' };
const START_ROWS = Object.entries(LABELS).map(([key, label]) => ({ key, label, status: 'checking', detail: '' }));

// Health JSON -> rows for the screen
function toRows(health) {
  return Object.entries(LABELS).map(([key, label]) => {
    const check = health.checks?.[key] || { status: 'down' };
    let detail = check.status === 'up' ? 'Ready' : check.status === 'off' ? 'Off' : check.status === 'warn' ? 'Not ready' : 'Down';
    if (key === 'database' && check.latencyMs !== undefined) detail = `${check.latencyMs} ms`;
    return { key, label, status: check.status, detail };
  });
}

export default function ServerGate({ children }) {
  // Already checked in this session? Then start "ready" and skip the screen.
  const [phase, setPhase] = useState(() => (checkedThisSession() ? 'ready' : 'checking')); // 'checking' | 'ok' | 'error' | 'leaving' | 'ready'
  const [rows, setRows] = useState(START_ROWS);
  const [error, setError] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const check = useCallback(async () => {
    clearTimers();
    setPhase('checking');
    setError('');
    setRows(START_ROWS);
    const started = Date.now();

    let health;
    try {
      health = await getHealth();
    } catch {
      health = null; // server did not answer at all
    }

    // Wait so the animation can play, then show the result
    const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - started));
    later(() => {
      if (!health) {
        setRows(START_ROWS.map((r) => ({ ...r, status: 'down', detail: r.key === 'api' ? 'No answer' : '—' })));
        fail('We cannot reach the server. Check that the API is running and your internet connection.');
        return;
      }
      setRows(toRows(health));
      if (health.status === 'ok') {
        rememberChecked(); // do not show this screen again in this session
        setPhase('ok'); // show the green rows, then fade out, then show the app
        later(() => setPhase('leaving'), SHOW_OK_MS);
        later(() => setPhase('ready'), SHOW_OK_MS + LEAVE_MS);
      } else {
        const down = Object.entries(health.checks || {}).find(([, c]) => c.status === 'down');
        fail(down ? down[1].message : 'The server is not ready yet.');
      }
    }, wait);
  }, []);

  // Show the error and count down to the next automatic try
  function fail(message) {
    setPhase('error');
    setError(message);
    for (let s = RETRY_SECONDS; s >= 0; s--) {
      later(() => (s === 0 ? check() : setRetryIn(s)), (RETRY_SECONDS - s) * 1000);
    }
  }

  useEffect(() => {
    if (!checkedThisSession()) check();
    return clearTimers;
  }, [check]);

  if (phase === 'ready') return children;

  const done = rows.filter((r) => r.status !== 'checking').length;
  return (
    <StartupScreen
      title={phase === 'error' ? 'Something is not ready' : phase === 'checking' ? 'Checking the server' : 'All systems ready'}
      rows={rows}
      progress={phase === 'checking' ? -1 : (done / rows.length) * 100}
      error={phase === 'error' ? error : ''}
      retryIn={retryIn}
      onRetry={check}
      leaving={phase === 'leaving'}
    />
  );
}
