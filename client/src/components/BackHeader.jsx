// Back arrow (and optional title) at the top of a page.
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export default function BackHeader({ title }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton aria-label="Back" onClick={() => navigate('/home')} sx={{ ml: -1, color: '#1B1B1D' }}>
        <ArrowBackIcon />
      </IconButton>
      {title && <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{title}</Typography>}
    </Box>
  );
}
