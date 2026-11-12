// The two cards on Home: "Task Complete" (blue) and "Task Pending" (red) for the week.
import { Box, Typography, Skeleton } from '@mui/material';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import { colors } from '../theme';

function Card({ icon, label, count, bg, iconBg, loading }) {
  return (
    <Box sx={{ flex: 1, bgcolor: bg, p: 1.5, borderRadius: '2px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 26, height: 26, bgcolor: iconBg, display: 'grid', placeItems: 'center', borderRadius: '2px' }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: 12 }}>{label}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.75, mt: 1 }}>
        {loading ? (
          <Skeleton width={28} height={30} /> // grey box while tasks load
        ) : (
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>{String(count).padStart(2, '0')}</Typography>
        )}
        <Typography sx={{ fontSize: 9, color: '#6B6B70' }}>This Week</Typography>
      </Box>
    </Box>
  );
}

export default function SummaryCards({ completed, pending, loading }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
      <Card
        loading={loading}
        label="Task Complete"
        count={completed}
        bg={colors.completeBg}
        iconBg="#BFC7F5"
        icon={<CheckBoxOutlinedIcon sx={{ fontSize: 20, color: colors.primary }} />}
      />
      <Card
        loading={loading}
        label="Task Pending"
        count={pending}
        bg={colors.pendingBg}
        iconBg="#F5B5B2"
        icon={<DisabledByDefaultOutlinedIcon sx={{ fontSize: 20, color: colors.pendingIcon }} />}
      />
    </Box>
  );
}
