// Round "+" button that opens the Add Task sheet.
// It floats above the bottom navigation bar.
import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTasks } from '../context/TaskContext';
import { BOTTOM_NAV_HEIGHT } from './BottomNav';

export default function AddFab({ date = null }) {
  const { openSheet } = useTasks();
  return (
    <Fab
      color="primary"
      aria-label="Add task"
      onClick={() => openSheet(null, date)}
      sx={{
        position: 'fixed',
        bottom: `calc(${BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`, // 16px above the nav bar (and the iPhone home bar)
        left: '50%',
        transform: 'translateX(-50%)',
        width: 64,
        height: 64,
        boxShadow: '0 6px 16px rgba(75, 102, 225, 0.35)',
        zIndex: 11,
      }}
    >
      <AddIcon sx={{ fontSize: 30 }} />
    </Fab>
  );
}
