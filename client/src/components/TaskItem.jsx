// One task row: checkbox (status), title, time, delete and edit icons.
// Swipe left on a phone to show a red "Delete" button.
import { useRef, useState } from 'react';
import { Box, Checkbox, IconButton, Typography, Button, CircularProgress } from '@mui/material';
import { TrashIcon, EditIcon } from './icons';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import { useTasks } from '../context/TaskContext';
import { formatTime, formatTimeText } from '../utils/dateUtils';
import { colors } from '../theme';

const PRIORITY_COLOR = { Low: '#4CAF50', Medium: '#F5A623', High: '#E35D5D' };
const SWIPE_WIDTH = 80; // width of the hidden "Delete" button

export default function TaskItem({ task, showDate = false }) {
  const { toggleStatus, removeTask, openSheet, openDetails, notify, confirm } = useTasks();
  const [busy, setBusy] = useState(null); // 'toggle' | 'delete' | null -> shows a spinner
  const [offset, setOffset] = useState(0); // how far the row moved left (0 to -80)
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const done = task.status === 'Completed';

  // --- swipe left to show Delete ---
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX - offset;
    setDragging(true);
  };
  const onTouchMove = (e) => {
    const diff = e.touches[0].clientX - startX.current;
    setOffset(Math.max(-SWIPE_WIDTH, Math.min(0, diff))); // only move left, max 80px
  };
  const onTouchEnd = () => {
    setDragging(false);
    setOffset(offset < -SWIPE_WIDTH / 2 ? -SWIPE_WIDTH : 0); // snap open or closed
  };

  // Run an API action, show a spinner while it runs, show a message if it fails
  async function run(kind, action) {
    if (busy) return; // ignore double taps
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      notify(err.message);
      setBusy(null);
    }
    if (kind === 'toggle') setBusy(null); // after delete the row is gone, so no reset needed
  }
  const handleToggle = () => run('toggle', () => toggleStatus(task));
  // Ask first, then delete
  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete task?',
      message: `"${task.title}" will be removed from your list.`,
    });
    if (ok) run('delete', () => removeTask(task._id));
    else setOffset(0); // close the swipe if the user cancels
  }

  const spinner = <CircularProgress size={18} />;

  const time = formatTime(task.dateTime) + (task.endTime ? ` - ${formatTimeText(task.endTime)}` : '');
  const date = new Date(task.dateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Red Delete button behind the row (seen after swipe) */}
      <Button
        onClick={handleDelete}
        disabled={busy === 'delete'}
        sx={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: SWIPE_WIDTH,
          bgcolor: colors.pendingIcon, color: '#fff', borderRadius: 0,
          '&:hover': { bgcolor: '#C94848' },
        }}
      >
        {busy === 'delete' ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete'}
      </Button>

      {/* The row itself. It moves left when swiped. */}
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: colors.pageBg,
          position: 'relative',
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform .2s',
        }}
      >
        {busy === 'toggle' ? (
          <Box sx={{ width: 22, mr: 1.5, display: 'grid', placeItems: 'center' }}>{spinner}</Box>
        ) : (
        <Checkbox
          checked={done}
          icon={<CheckBoxOutlineBlankIcon />} // thin empty box, like Figma
          checkedIcon={<CheckBoxOutlinedIcon />} // thin box with a tick, like Figma
          onChange={handleToggle}
          inputProps={{ 'aria-label': done ? 'Mark as in progress' : 'Mark as completed' }}
          sx={{ p: 0, mr: 1.5, color: colors.primary, '& .MuiSvgIcon-root': { fontSize: 22 } }}
        />
        )}

        {/* Title + icons, with the line under them (like Figma) */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', py: 1.6, borderBottom: `1px solid ${colors.border}` }}>
          {/* Tap the task to see its details */}
          <Box onClick={() => openDetails(task)} sx={{ flex: 1, minWidth: 0, cursor: 'pointer', opacity: busy === 'delete' ? 0.5 : 1 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, textDecoration: done ? 'line-through' : 'none' }}>
              {task.title}
            </Typography>
            <Typography component="div" sx={{ fontSize: 10, color: colors.muted, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box component="span" title={`${task.priority} priority`} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: PRIORITY_COLOR[task.priority] }} />
              {showDate && `${date} · `}
              {time}
            </Typography>
          </Box>

          <IconButton size="small" aria-label="Delete task" onClick={handleDelete} disabled={!!busy} sx={{ color: '#B4B4B8' }}>
            {busy === 'delete' ? spinner : <TrashIcon sx={{ fontSize: 20 }} />}
          </IconButton>
          <IconButton size="small" aria-label="Edit task" onClick={() => openSheet(task)} disabled={!!busy} sx={{ color: '#B4B4B8', mr: -0.75 }}>
            <EditIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
