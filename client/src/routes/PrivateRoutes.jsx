// Pages for signed-in users only.
// TaskProvider is here (not in main.jsx), so tasks load only after sign in,
// and all task state is cleared on sign out.
// Any other URL (for example /signin) goes to Home.
// The bottom navigation bar is shown on every private page.
import { Routes, Route, Navigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import { TaskProvider, useTasks } from '../context/TaskContext';
import TaskSheet from '../components/TaskSheet';
import TaskDetails from '../components/TaskDetails';
import ConfirmDialog from '../components/ConfirmDialog';
import Home from '../pages/Home';
import Weeks from '../pages/Weeks';
import Search from '../pages/Search';
import Profile from '../pages/Profile';
import BottomNav, { BOTTOM_NAV_HEIGHT } from '../components/BottomNav';

// Shared pieces that every private page can open
function SharedOverlays() {
  const { toast, closeToast } = useTasks();
  return (
    <>
      {/* One Add/Edit sheet, one details drawer, one confirm dialog for the whole app */}
      <TaskSheet />
      <TaskDetails />
      <ConfirmDialog />

      {/* Error message (shown when an API call fails) */}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: { xs: BOTTOM_NAV_HEIGHT + 16 } }}>
        <Alert severity="error" variant="filled" onClose={closeToast} sx={{ width: '100%' }}>{toast}</Alert>
      </Snackbar>
    </>
  );
}

export default function PrivateRoutes() {
  return (
    <TaskProvider>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/weeks" element={<Weeks />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <BottomNav />
      <SharedOverlays />
    </TaskProvider>
  );
}
