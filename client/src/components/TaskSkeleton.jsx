// Grey placeholder rows shown while tasks are loading (MUI Skeleton).
import { Box, Skeleton } from '@mui/material';

export default function TaskSkeleton({ rows = 4 }) {
  return Array.from({ length: rows }, (_, i) => (
    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.6 }}>
      <Skeleton variant="rectangular" width={20} height={20} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="30%" height={12} />
      </Box>
      <Skeleton variant="rectangular" width={18} height={18} />
      <Skeleton variant="rectangular" width={18} height={18} />
    </Box>
  ));
}
