// Bottom navigation bar, shown only to signed-in users (see routes/PrivateRoutes.jsx).
// The selected tab follows the URL, so it is correct after a reload or a link.
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CalendarViewWeekOutlinedIcon from '@mui/icons-material/CalendarViewWeekOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useLocation, useNavigate } from 'react-router-dom';
import { colors } from '../theme';

export const BOTTOM_NAV_HEIGHT = 64; // px. Pages leave this much space at the bottom.

const TABS = [
  { path: '/home', label: 'Home', icon: <HomeOutlinedIcon /> },
  { path: '/weeks', label: 'Weeks', icon: <CalendarViewWeekOutlinedIcon /> },
  { path: '/search', label: 'Search', icon: <SearchIcon /> },
  { path: '/profile', label: 'Profile', icon: <PersonOutlineIcon /> },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Paper
      component="nav"
      elevation={0}
      sx={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', // centered, like the app frame
        width: '100%', maxWidth: 430, borderTop: `1px solid ${colors.border}`, borderRadius: 0, zIndex: 10,
        pb: 'env(safe-area-inset-bottom)', // space for the iPhone home bar
      }}
    >
      <BottomNavigation
        showLabels
        value={pathname}
        onChange={(e, path) => navigate(path)}
        sx={{ height: BOTTOM_NAV_HEIGHT, bgcolor: '#fff' }}
      >
        {TABS.map((tab) => (
          <BottomNavigationAction
            key={tab.path}
            value={tab.path}
            label={tab.label}
            icon={tab.icon}
            sx={{
              color: colors.muted,
              minWidth: 0,
              '& .MuiBottomNavigationAction-label': { fontSize: 11, mt: 0.25 },
              '&.Mui-selected': { color: colors.primary },
              '&.Mui-selected .MuiBottomNavigationAction-label': { fontSize: 11, fontWeight: 600 },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
