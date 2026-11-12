// A field that looks like Figma ("Start", "Ends", "Friday 14, January").
// Tap it -> a picker dialog opens:
//   type="time" -> TimeSheet (scroll wheels + quick times), value like "14:30"
//   type="date" -> DateSheet (calendar + quick dates),      value like "2026-11-12"
import { useState } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import TimeSheet from './pickers/TimeSheet';
import DateSheet from './pickers/DateSheet';

export default function PickerField({ type, value, onChange, placeholder, display, icon, iconEnd, error, helperText, sx, label }) {
  const [open, setOpen] = useState(false);

  // Called when the user taps Done in the sheet
  const handleDone = (newValue) => {
    onChange(newValue);
    setOpen(false);
  };

  const adornment = <InputAdornment position={iconEnd ? 'end' : 'start'}>{icon}</InputAdornment>;
  const sheetProps = { open, value, onClose: () => setOpen(false), onDone: handleDone };

  return (
    <>
      {/* The visible field (read-only, opens the sheet) */}
      <TextField
        fullWidth
        value={value ? display : ''}
        placeholder={placeholder}
        onClick={() => setOpen(true)}
        error={error}
        helperText={helperText}
        sx={{ ...sx, '& input': { cursor: 'pointer', py: 1.1 } }}
        InputProps={{ readOnly: true, [iconEnd ? 'endAdornment' : 'startAdornment']: adornment }}
        inputProps={{ 'aria-label': label }}
      />

      {type === 'time' ? <TimeSheet title={label} {...sheetProps} /> : <DateSheet {...sheetProps} />}
    </>
  );
}
