// Small date helpers. Weeks start on Monday and end on Sunday.

// Return the Monday (at 00:00) of the week that has this date.
export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // how many days back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Add some days to a date and return a new date.
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// The 7 days (Mon..Sun) of the week that has this date.
export function getWeekDays(date) {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function isInWeek(date, anyDayOfWeek) {
  return startOfWeek(date).getTime() === startOfWeek(anyDayOfWeek).getTime();
}

// Group tasks by week. Returns: [{ weekStart, tasks, open, completed }], newest week first.
export function groupTasksByWeek(tasks) {
  const groups = {};
  tasks.forEach((task) => {
    const key = startOfWeek(task.dateTime).toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  });

  return Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .map((key) => {
      const weekTasks = groups[key];
      const completed = weekTasks.filter((t) => t.status === 'Completed').length;
      return {
        weekStart: new Date(key),
        tasks: weekTasks,
        completed,
        open: weekTasks.length - completed,
      };
    });
}

// "10 Nov - 16 Nov"
export function formatWeekRange(weekStart) {
  const opts = { day: 'numeric', month: 'short' };
  const end = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-GB', opts)}`;
}

// "Friday 14, January" (same style as Figma)
export function formatLongDate(date) {
  const d = new Date(date);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday} ${d.getDate()}, ${month}`;
}

// "09:30 AM"
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// "14:30" -> "02:30 PM"
export function formatTimeText(hhmm) {
  if (!hhmm) return '';
  return formatTime(`2000-01-01T${hhmm}`);
}

// Values for <input type="date"> ("2026-11-12") and <input type="time"> ("09:30")
export function toDateInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
