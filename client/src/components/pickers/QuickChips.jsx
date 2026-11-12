// Row of quick-pick buttons (for example "Today", "9:00 AM").
import { Box, Chip } from '@mui/material';
import { colors } from '../../theme';

export default function QuickChips({ options, isActive, onPick }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = isActive(opt.value);
        return (
          <Chip
            key={opt.label}
            label={opt.label}
            onClick={() => onPick(opt.value)}
            sx={{
              borderRadius: '2px',
              fontSize: 12,
              bgcolor: active ? colors.primary : colors.completeBg,
              color: active ? '#fff' : colors.primary,
              '&:hover': { bgcolor: active ? colors.primary : '#E2E6FC' },
            }}
          />
        );
      })}
    </Box>
  );
}
