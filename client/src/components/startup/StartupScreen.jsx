// Full-screen loading screen (the first thing the user sees).
// Blue gradient, floating logo, app name, and a glass card with one row per server check.
import { Box, Typography, LinearProgress, Button, CircularProgress } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { keyframes } from '@emotion/react';
import SplashLogo from './SplashLogo';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Icon for each status: checking (spinner), up (green), down (red), warn (amber), off (grey)
function StatusIcon({ status }) {
  if (status === 'checking') return <CircularProgress size={18} thickness={5} sx={{ color: 'rgba(255,255,255,.85)' }} />;
  if (status === 'up') return <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#7CF0B0' }} />;
  if (status === 'down') return <CancelRoundedIcon sx={{ fontSize: 20, color: '#FF9B9B' }} />;
  if (status === 'warn') return <ErrorRoundedIcon sx={{ fontSize: 20, color: '#FFD27A' }} />;
  return <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,.5)' }} />;
}

// rows: [{ key, label, status, detail }]
export default function StartupScreen({ title = 'Getting things ready', rows = [], progress = null, error = '', retryIn = 0, onRetry, leaving = false }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        background: 'linear-gradient(160deg, #5B74F0 0%, #4B66E1 45%, #2B3B93 100%)',
        transition: 'opacity .45s ease, transform .45s ease',
        opacity: leaving ? 0 : 1, // fade out when everything is ready
        transform: leaving ? 'scale(1.03)' : 'none',
      }}
    >
      {/* soft background shapes */}
      <Box sx={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', border: '26px solid rgba(255,255,255,.08)' }} />
      <Box sx={{ position: 'absolute', bottom: -90, left: -60, width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.06)' }} />
      <Box component="svg" viewBox="0 0 80 50" sx={{ position: 'absolute', width: 90, top: '14%', left: -12, opacity: 0.35 }}>
        {[0, 10, 20, 30].map((y) => (
          <path key={y} d="M0 10 L10 0 L20 10 L30 0 L40 10 L50 0 L60 10 L70 0 L80 10" transform={`translate(0 ${y + 5})`} fill="none" stroke="#fff" strokeWidth="2.5" />
        ))}
      </Box>

      <SplashLogo />

      <Typography sx={{ fontSize: 26, fontWeight: 600, mt: 3, letterSpacing: 0.3, animation: `${fadeUp} .6s ease both` }}>
        To Do List
      </Typography>
      <Typography sx={{ fontSize: 13, opacity: 0.8, mt: 0.5, animation: `${fadeUp} .6s .1s ease both` }}>
        Manage what to do, week by week
      </Typography>

      {/* Glass card with the checks */}
      {rows.length > 0 && (
        <Box
          sx={{
            width: '100%', maxWidth: 320, mt: 5, p: 2,
            borderRadius: '14px',
            bgcolor: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.18)',
            backdropFilter: 'blur(10px)',
            animation: `${fadeUp} .6s .2s ease both`,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.85, mb: 1.25, textTransform: 'uppercase', letterSpacing: 1 }}>
            {title}
          </Typography>

          {rows.map((row, i) => (
            <Box key={row.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.9, animation: `${fadeUp} .4s ${0.3 + i * 0.08}s ease both` }}>
              <Box sx={{ width: 22, display: 'grid', placeItems: 'center' }}><StatusIcon status={row.status} /></Box>
              <Typography sx={{ fontSize: 14, flex: 1 }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 11, opacity: 0.75, textAlign: 'right' }}>{row.detail}</Typography>
            </Box>
          ))}

          {progress !== null && (
            <LinearProgress
              variant={progress < 0 ? 'indeterminate' : 'determinate'}
              value={Math.max(progress, 0)}
              sx={{ mt: 1.5, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,.2)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 2 } }}
            />
          )}
        </Box>
      )}

      {/* Error + retry */}
      {error && (
        <Box sx={{ width: '100%', maxWidth: 320, mt: 2.5, textAlign: 'center', animation: `${fadeUp} .4s ease both` }}>
          <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>{error}</Typography>
          <Button
            onClick={onRetry}
            startIcon={<RefreshRoundedIcon />}
            sx={{ mt: 2, px: 3, py: 1, borderRadius: '2px', bgcolor: '#fff', color: '#2B3B93', fontWeight: 600, '&:hover': { bgcolor: '#EEF0FD' } }}
          >
            Try again{retryIn > 0 ? ` (${retryIn}s)` : ''}
          </Button>
        </Box>
      )}

      <Typography sx={{ position: 'absolute', bottom: 18, fontSize: 11, opacity: 0.55 }}>v1.0</Typography>
    </Box>
  );
}
