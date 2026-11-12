// Dialog to pick a time: quick chips + 3 scroll wheels (hour, minute, AM/PM).
// Value in and out is text "HH:mm" (24-hour), for example "14:30".
import { useEffect, useState } from 'react';
import { Dialog, Box } from '@mui/material';
import WheelColumn, { ROW } from './WheelColumn';
import { DialogTitleRow, DialogButtons } from './DialogParts';
import QuickChips from './QuickChips';
import { colors } from '../../theme';

const pad = (n) => String(n).padStart(2, '0');

// Wheel items
const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: pad(i + 1) }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: i, label: pad(i) }));
const PERIODS = [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }];

const PRESETS = [
  { label: '9:00 AM', value: '09:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '3:00 PM', value: '15:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '9:00 PM', value: '21:00' },
];

// "14:30" -> { hour: 2, minute: 30, period: "PM" }
function split(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h % 12 || 12, minute: m, period: h >= 12 ? 'PM' : 'AM' };
}

// { hour: 2, minute: 30, period: "PM" } -> "14:30"
function join({ hour, minute, period }) {
  let h = hour % 12;
  if (period === 'PM') h += 12;
  return `${pad(h)}:${pad(minute)}`;
}

// Default when the field is empty: the next full hour
function nextHour() {
  return `${pad((new Date().getHours() + 1) % 24)}:00`;
}

export default function TimeSheet({ open, title, value, onClose, onDone }) {
  const [time, setTime] = useState(split(value || nextHour()));

  // Reset the wheels each time the sheet opens
  useEffect(() => {
    if (open) setTime(split(value || nextHour()));
  }, [open, value]);

  const set = (key) => (v) => setTime((t) => ({ ...t, [key]: v }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth
      PaperProps={{ sx: { maxWidth: 360, m: 2, borderRadius: '2px' } }}>
      <DialogTitleRow title={title} />

      <QuickChips options={PRESETS} isActive={(v) => v === join(time)} onPick={(v) => setTime(split(v))} />

      {/* The 3 wheels, with a light band behind the selected row */}
      <Box sx={{ position: 'relative', display: 'flex', px: 2, pb: 2.5 }}>
        <Box sx={{ position: 'absolute', left: 16, right: 16, top: ROW * 2, height: ROW, bgcolor: colors.completeBg, borderRadius: '2px' }} />
        <WheelColumn label="Hour" items={HOURS} value={time.hour} onChange={set('hour')} />
        <Box sx={{ display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 600, color: colors.primary, zIndex: 1 }}>:</Box>
        <WheelColumn label="Minute" items={MINUTES} value={time.minute} onChange={set('minute')} />
        <WheelColumn label="AM or PM" items={PERIODS} value={time.period} onChange={set('period')} />
      </Box>
      <DialogButtons onCancel={onClose} onDone={() => onDone(join(time))} />
    </Dialog>
  );
}
