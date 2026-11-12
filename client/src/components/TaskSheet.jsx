// "Add New Task" bottom sheet. The same sheet is used to edit a task.
// MUI Drawer with anchor="bottom" makes it slide up from the bottom, like Figma.
import { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, Button,
  ToggleButton, ToggleButtonGroup, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PickerField from './PickerField';
import { useTasks } from '../context/TaskContext';
import { toDateInput, toTimeInput, formatLongDate, formatTimeText } from '../utils/dateUtils';
import { colors } from '../theme';

// Empty form (for a new task)
const emptyForm = (date) => ({
  title: '',
  startTime: '',
  endTime: '',
  date: toDateInput(date || new Date()),
  priority: 'Medium',
  description: '',
});

// Small grey label above each field
const Label = ({ children }) => (
  <Typography sx={{ fontSize: 11, color: '#6B6B70', mb: 0.75, mt: 2 }}>{children}</Typography>
);

const clockIcon = <AccessTimeIcon sx={{ fontSize: 16, color: '#1B1B1D' }} />;

// Same look for all inputs: thin grey border, small text, square corners
const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '2px', fontSize: 13, bgcolor: '#fff' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
  '& input': { py: 1.1 },
};

export default function TaskSheet() {
  const { sheet, closeSheet, addTask, editTask, removeTask, confirm } = useTasks();
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false); // spinner on the Save button
  const [deleting, setDeleting] = useState(false); // spinner on the Delete button
  const busy = saving || deleting;
  const isEdit = Boolean(sheet.task);

  // Fill the form each time the sheet opens
  useEffect(() => {
    if (!sheet.open) return;
    setErrors({});
    if (sheet.task) {
      const t = sheet.task;
      setForm({
        title: t.title,
        startTime: toTimeInput(t.dateTime),
        endTime: t.endTime || '',
        date: toDateInput(t.dateTime),
        priority: t.priority || 'Medium',
        description: t.description || '',
      });
    } else {
      setForm(emptyForm(sheet.date));
    }
  }, [sheet]);

  // Change one field and remove its error message (the user is fixing it).
  // Start/end time errors depend on each other, so both are cleared together.
  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const next = { ...e, [field]: undefined, api: undefined };
      if (field === 'startTime' || field === 'endTime') next.startTime = next.endTime = undefined;
      return next;
    });
  }

  const update = (field) => (e) => setField(field, e.target.value); // for text inputs
  const setValue = (field) => (value) => setField(field, value); // for pickers

  // Check the required fields. Return true if the form is OK.
  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (form.endTime && form.startTime && form.endTime <= form.startTime) e.endTime = 'End must be after start';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      dateTime: new Date(`${form.date}T${form.startTime}`), // date + start time -> one Date
      endTime: form.endTime,
      priority: form.priority,
    };
    try {
      setSaving(true);
      if (isEdit) await editTask(sheet.task._id, data);
      else await addTask(data);
      closeSheet();
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete task?',
      message: `"${sheet.task.title}" will be removed from your list.`,
    });
    if (!ok) return;
    try {
      setDeleting(true);
      await removeTask(sheet.task._id);
      closeSheet();
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setDeleting(false);
    }
  }

  // Do not close the sheet while an API call is running
  const handleClose = () => !busy && closeSheet();

  return (
    <Drawer
      anchor="bottom"
      open={sheet.open}
      onClose={handleClose}
      PaperProps={{ sx: { maxWidth: 430, mx: 'auto', borderRadius: 0 } }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>{isEdit ? 'Edit Task' : 'Add New Task'}</Typography>
          <IconButton size="small" aria-label="Close" onClick={handleClose} disabled={busy}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Label>Task title</Label>
        <TextField fullWidth placeholder="Doing Homework" value={form.title} onChange={update('title')}
          error={!!errors.title} helperText={errors.title} sx={inputSx} />

        <Label>Set Time</Label>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <PickerField type="time" label="Start time" placeholder="Start" value={form.startTime}
            display={formatTimeText(form.startTime)} onChange={setValue('startTime')} icon={clockIcon}
            error={!!errors.startTime} helperText={errors.startTime} sx={inputSx} />
          <PickerField type="time" label="End time" placeholder="Ends" value={form.endTime}
            display={formatTimeText(form.endTime)} onChange={setValue('endTime')} icon={clockIcon}
            error={!!errors.endTime} helperText={errors.endTime} sx={inputSx} />
        </Box>

        <Label>Set Date</Label>
        <PickerField type="date" label="Date" placeholder="Select date" value={form.date}
          display={form.date && formatLongDate(`${form.date}T00:00`)} onChange={setValue('date')}
          icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: '#6B6B70' }} />} iconEnd
          error={!!errors.date} helperText={errors.date} sx={inputSx} />

        <Label>Priority</Label>
        <ToggleButtonGroup exclusive fullWidth size="small" value={form.priority}
          onChange={(e, value) => value && setForm({ ...form, priority: value })}>
          {['Low', 'Medium', 'High'].map((p) => (
            <ToggleButton key={p} value={p} sx={{ fontSize: 12, py: 0.75, borderRadius: '2px',
              '&.Mui-selected': { bgcolor: colors.completeBg, color: colors.primary } }}>
              {p}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Label>Description</Label>
        <TextField fullWidth multiline rows={3} placeholder="Add Description" value={form.description}
          onChange={update('description')} sx={inputSx} />

        {errors.api && <Typography color="error" sx={{ fontSize: 12, mt: 1 }}>{errors.api}</Typography>}

        <Button fullWidth variant="contained" disableElevation onClick={handleSave} disabled={busy}
          startIcon={saving && <CircularProgress size={18} color="inherit" />}
          sx={{ mt: 2.5, py: 1.25, borderRadius: '2px', fontSize: 14,
            '&.Mui-disabled': { bgcolor: colors.primary, color: '#fff', opacity: 0.8 } }}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
        </Button>

        {isEdit && (
          <Button fullWidth color="error" onClick={handleDelete} disabled={busy}
            startIcon={deleting && <CircularProgress size={16} color="inherit" />}
            sx={{ mt: 1, fontSize: 13, '&.Mui-disabled': { color: colors.pendingIcon } }}>
            {deleting ? 'Deleting...' : 'Delete task'}
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
