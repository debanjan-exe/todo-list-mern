// Row of 7 days (Mon..Sun). The selected day has a blue box with a small dot.
// Arrows move to the previous / next week.
import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getWeekDays, isSameDay, addDays } from '../utils/dateUtils';
import { colors } from '../theme';

export default function WeekStrip({ selectedDate, onSelect }) {
  const days = getWeekDays(selectedDate);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
      <IconButton size="small" aria-label="Previous week" onClick={() => onSelect(addDays(selectedDate, -7))} sx={{ p: 0.25, color: colors.muted }}>
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          return (
            <Box
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              sx={{
                width: 34,
                py: 0.75,
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: '2px',
                bgcolor: selected ? colors.primary : 'transparent',
                color: selected ? '#fff' : colors.muted,
              }}
            >
              <Typography sx={{ fontSize: 10, lineHeight: 1.6 }}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: selected ? '#fff' : '#9E9EA3' }}>
                {String(day.getDate()).padStart(2, '0')}
              </Typography>
              {/* small dot under the selected day */}
              <Box sx={{ width: 3, height: 3, mx: 'auto', mt: 0.25, borderRadius: '50%', bgcolor: selected ? '#fff' : 'transparent' }} />
            </Box>
          );
        })}
      </Box>

      <IconButton size="small" aria-label="Next week" onClick={() => onSelect(addDays(selectedDate, 7))} sx={{ p: 0.25, color: colors.muted }}>
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
