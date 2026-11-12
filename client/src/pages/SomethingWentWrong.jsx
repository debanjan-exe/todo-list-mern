// "Something went wrong" page. ErrorBoundary shows it when a screen crashes,
// so the user sees a friendly page and a way out, not a blank screen.
import { useState } from 'react';
import { Box, Typography, Button, Collapse } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { keyframes } from '@emotion/react';
import { colors } from '../theme';

const wobble = keyframes`
  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(4deg); }
`;

// Small drawing: a task card with a broken tick and a warning badge
function BrokenTaskArt() {
  return (
    <Box sx={{ position: 'relative', width: 150, height: 130, animation: `${wobble} 3s ease-in-out infinite` }}>
      <svg width="150" height="130" viewBox="0 0 150 130" fill="none">
        <rect x="20" y="20" width="100" height="90" rx="6" fill={colors.completeBg} stroke={colors.primary} strokeWidth="3" />
        <rect x="34" y="38" width="16" height="16" rx="2" stroke={colors.primary} strokeWidth="3" />
        <path d="M58 46h46" stroke={colors.primaryLight} strokeWidth="6" strokeLinecap="round" />
        <rect x="34" y="64" width="16" height="16" rx="2" stroke={colors.primary} strokeWidth="3" />
        <path d="M58 72h30" stroke={colors.primaryLight} strokeWidth="6" strokeLinecap="round" />
        {/* broken tick */}
        <path d="M36 92l5 5" stroke={colors.pendingIcon} strokeWidth="3" strokeLinecap="round" />
        <path d="M45 94l7-9" stroke={colors.pendingIcon} strokeWidth="3" strokeLinecap="round" />
        {/* warning badge */}
        <circle cx="118" cy="26" r="20" fill={colors.pendingIcon} />
        <path d="M118 15v14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="118" cy="36" r="2.6" fill="#fff" />
      </svg>
    </Box>
  );
}

export default function SomethingWentWrong({ error, onReset }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3, textAlign: 'center', bgcolor: colors.pageBg }}>
      <BrokenTaskArt />

      <Typography sx={{ fontSize: 22, fontWeight: 600, mt: 3 }}>Something went wrong</Typography>
      <Typography sx={{ fontSize: 13, color: '#6B6B70', mt: 1, maxWidth: 280, lineHeight: 1.7 }}>
        This screen stopped working. Your tasks are safe. Try again, or go back to Home.
      </Typography>

      <Box sx={{ width: '100%', maxWidth: 300, mt: 4, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Button fullWidth variant="contained" disableElevation startIcon={<RefreshRoundedIcon />} onClick={onReset}
          sx={{ py: 1.25, borderRadius: '2px', fontSize: 14 }}>
          Try again
        </Button>
        {/* full reload: clears any broken state in memory */}
        <Button fullWidth variant="outlined" startIcon={<HomeOutlinedIcon />} onClick={() => window.location.assign('/')}
          sx={{ py: 1.25, borderRadius: '2px', fontSize: 14 }}>
          Go to Home
        </Button>
      </Box>

      {/* Technical details for developers (hidden by default) */}
      {error && (
        <Box sx={{ width: '100%', maxWidth: 300, mt: 3 }}>
          <Button size="small" onClick={() => setShowDetails(!showDetails)} sx={{ color: colors.muted, fontSize: 11 }}>
            {showDetails ? 'Hide details' : 'Show details'}
          </Button>
          <Collapse in={showDetails}>
            <Box component="pre" sx={{ textAlign: 'left', fontSize: 11, color: colors.pendingIcon, bgcolor: colors.pendingBg, p: 1.5, borderRadius: '2px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 160, overflow: 'auto' }}>
              {String(error?.message || error)}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
