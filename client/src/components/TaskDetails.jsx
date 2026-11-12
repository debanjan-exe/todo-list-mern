// Task details drawer (read-only). Opens when the user taps a task.
// Top right: Edit and Delete icons, and Close.
// Edit closes this drawer first and then opens the Edit sheet (no drawer on top of a drawer).
import { useState } from 'react';
import { Drawer, Box, Typography, IconButton, Button, CircularProgress, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { TrashIcon, EditIcon } from './icons';
import { useTasks } from '../context/TaskContext';
import { formatLongDate, formatTime, formatTimeText } from '../utils/dateUtils';
import { colors } from '../theme';

const PRIORITY_COLOR = { Low: '#4CAF50', Medium: '#F5A623', High: '#E35D5D' };

// One line of information: icon + label + value
function InfoRow({ icon, label, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
      <Box sx={{ color: colors.muted, display: 'grid' }}>{icon}</Box>
      <Typography sx={{ fontSize: 12, color: colors.muted, width: 64 }}>{label}</Typography>
      <Box sx={{ fontSize: 13, fontWeight: 500 }}>{children}</Box>
    </Box>
  );
}

export default function TaskDetails() {
  const { detailsTask: task, detailsOpen, closeDetails, openSheet, removeTask, toggleStatus, confirm, notify } = useTasks();
  const [busy, setBusy] = useState(null); // 'toggle' | 'delete' | null

  // Close the drawer if the task is gone (for example, deleted from another place)
  const open = detailsOpen && !!task;
  const close = () => !busy && closeDetails();

  function handleEdit() {
    closeDetails();
    openSheet(task);
  }

  async function handleDelete() {
    const ok = await confirm({ title: 'Delete task?', message: `"${task.title}" will be removed from your list.` });
    if (!ok) return;
    setBusy('delete');
    try {
      await removeTask(task._id);
      closeDetails();
    } catch (err) {
      notify(err.message);
    }
    setBusy(null);
  }

  async function handleToggle() {
    setBusy('toggle');
    try {
      await toggleStatus(task);
    } catch (err) {
      notify(err.message);
    }
    setBusy(null);
  }

  const done = task?.status === 'Completed';

  return (
    <Drawer anchor="bottom" open={open} onClose={close}
      PaperProps={{ sx: { maxWidth: 430, mx: 'auto', borderRadius: 0 } }}>
      {task && (
        <Box sx={{ px: 2.5, pt: 2, pb: 3 }}>
          {/* Header: title + edit, delete, close */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 500, flex: 1 }}>Task Details</Typography>
            <IconButton aria-label="Edit task" onClick={handleEdit} disabled={!!busy} sx={{ color: colors.primary }}>
              <EditIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton aria-label="Delete task" onClick={handleDelete} disabled={!!busy} sx={{ color: colors.pendingIcon }}>
              {busy === 'delete' ? <CircularProgress size={18} color="inherit" /> : <TrashIcon sx={{ fontSize: 20 }} />}
            </IconButton>
            <IconButton aria-label="Close" onClick={close} disabled={!!busy}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Title + status badge */}
          <Typography sx={{ fontSize: 20, fontWeight: 600, mt: 1.5, textDecoration: done ? 'line-through' : 'none', wordBreak: 'break-word' }}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'inline-block', mt: 1, px: 1, py: 0.25, borderRadius: '2px', fontSize: 11, fontWeight: 500,
            bgcolor: done ? colors.completeBg : colors.pendingBg, color: done ? colors.primary : colors.pendingIcon }}>
            {task.status}
          </Box>

          <Divider sx={{ my: 2, borderColor: colors.border }} />

          {/* Information rows */}
          <InfoRow icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 18 }} />} label="Date">
            {formatLongDate(task.dateTime)}
          </InfoRow>
          <InfoRow icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} label="Time">
            {formatTime(task.dateTime)}{task.endTime && ` - ${formatTimeText(task.endTime)}`}
          </InfoRow>
          <InfoRow icon={<FlagOutlinedIcon sx={{ fontSize: 18 }} />} label="Priority">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_COLOR[task.priority] }} />
              {task.priority}
            </Box>
          </InfoRow>

          {/* Description */}
          <Typography sx={{ fontSize: 12, color: colors.muted, mt: 2, mb: 0.75 }}>Description</Typography>
          <Typography sx={{ fontSize: 13, color: task.description ? colors.text : colors.muted, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {task.description || 'No description'}
          </Typography>

          {/* Status button */}
          <Button fullWidth variant={done ? 'outlined' : 'contained'} disableElevation onClick={handleToggle} disabled={!!busy}
            startIcon={busy === 'toggle' && <CircularProgress size={18} color="inherit" />}
            sx={{ mt: 3, py: 1.25, borderRadius: '2px', fontSize: 14 }}>
            {done ? 'Mark as In Progress' : 'Mark as Completed'}
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
