// Dialog to pick a date: quick chips (Today, Tomorrow, Next Monday) + calendar.
// Value in and out is text "YYYY-MM-DD". The calendar is MUI X DateCalendar.
import { useEffect, useState } from 'react';
import { Dialog } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import { DialogTitleRow, DialogButtons } from './DialogParts';
import QuickChips from './QuickChips';
import { colors } from '../../theme';

const FORMAT = 'YYYY-MM-DD';

// Quick picks. dayjs().day(8) = Monday of next week.
const presets = () => [
  { label: 'Today', value: dayjs().format(FORMAT) },
  { label: 'Tomorrow', value: dayjs().add(1, 'day').format(FORMAT) },
  { label: 'Next Monday', value: dayjs().day(8).format(FORMAT) },
];

export default function DateSheet({ open, value, onClose, onDone }) {
  const [date, setDate] = useState(value || dayjs().format(FORMAT));

  useEffect(() => {
    if (open) setDate(value || dayjs().format(FORMAT));
  }, [open, value]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth
      PaperProps={{ sx: { maxWidth: 360, m: 2, borderRadius: '2px' } }}>
      <DialogTitleRow title="Set Date" />

      <QuickChips options={presets()} isActive={(v) => v === date} onPick={setDate} />

      <DateCalendar
        value={dayjs(date)}
        onChange={(d) => d && setDate(d.format(FORMAT))}
        sx={{
          width: '100%',
          height: 'auto',
          mb: 0,
          '& .MuiPickersDay-root': { fontSize: 13 },
          '& .MuiPickersDay-root.Mui-selected': { bgcolor: colors.primary },
          '& .MuiPickersDay-today:not(.Mui-selected)': { borderColor: colors.primary },
          '& .MuiDayCalendar-weekDayLabel': { color: colors.muted },
        }}
      />

      <DialogButtons onCancel={onClose} onDone={() => onDone(date)} />
    </Dialog>
  );
}
