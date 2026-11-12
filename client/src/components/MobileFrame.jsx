// Keeps the app at phone width. On a phone it fills the screen.
// On a big screen it shows in the middle, like a phone.
import { Box } from '@mui/material';
import { colors } from '../theme';

export default function MobileFrame({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 430,
          minHeight: '100vh',
          bgcolor: colors.pageBg,
          position: 'relative',
          boxShadow: { sm: '0 0 24px rgba(0,0,0,0.06)' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
