// First screen: blue top area with white zig-zag lines, title, text and "Get Started".
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { colors } from '../theme';

// White zig-zag lines (drawn with SVG, so no image file is needed)
function ZigZag({ sx }) {
  const line = 'M0 10 L10 0 L20 10 L30 0 L40 10 L50 0 L60 10 L70 0 L80 10';
  return (
    <Box component="svg" viewBox="0 0 80 50" sx={{ position: 'absolute', width: 90, ...sx }}>
      {[0, 10, 20, 30].map((y) => (
        <path key={y} d={line} transform={`translate(0 ${y + 5})`} fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" />
      ))}
    </Box>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Blue area */}
      <Box sx={{ flex: 1, minHeight: '60vh', bgcolor: colors.primary, position: 'relative', overflow: 'hidden' }}>
        {/* circle at the top right */}
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 110, height: 110, borderRadius: '50%', border: '14px solid rgba(255,255,255,0.15)' }} />
        <ZigZag sx={{ top: '12%', left: -10 }} />
        <ZigZag sx={{ bottom: '6%', right: -10 }} />
      </Box>

      {/* Text + button */}
      <Box sx={{ px: 3, pt: 4, pb: 5 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Manage What To Do</Typography>
        <Typography sx={{ fontSize: 12, color: '#6B6B70', mt: 1.5, maxWidth: 260, lineHeight: 1.7 }}>
          The best way to manage what you have to do, don't forget your plans
        </Typography>
        <Button fullWidth variant="contained" disableElevation onClick={() => navigate('/signin')}
          sx={{ mt: 6, py: 1.5, borderRadius: '2px', fontSize: 14 }}>
          Get Started
        </Button>
      </Box>
    </Box>
  );
}
