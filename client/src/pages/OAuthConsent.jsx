// OAuth consent page: Claude opens it when the user clicks "Connect" on the connector.
// URL: /oauth/authorize?client_id=...&redirect_uri=...&code_challenge=...&state=...
//
//   signed out -> keep the request, go to Sign In, then come back here (see routes/)
//   signed in  -> "Claude wants to access your To-Do List"  [Cancel] [Allow]
//   Allow      -> server makes a one-time code -> browser goes back to Claude
//   Cancel     -> back to Claude with error=access_denied
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Avatar } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getOAuthConsentInfo, approveOAuth, clearPendingOAuth } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const ACCESS = ['See your tasks and your name and email', 'Add, change and complete tasks', 'Delete tasks (Claude asks you first)'];

export default function OAuthConsent() {
  const { search } = useLocation();
  const query = search.replace(/^\?/, '');
  const { user } = useAuth();
  const [info, setInfo] = useState(null); // { clientName, denyUrl }
  const [error, setError] = useState('');
  const [step, setStep] = useState('ask'); // ask | allowing | done

  // Check the request with the server first (bad or old links show an error, not a button)
  useEffect(() => {
    clearPendingOAuth(); // the request is open now; do not open it again after the next sign in
    getOAuthConsentInfo(query).then(setInfo).catch((err) => setError(err.message));
  }, [query]);

  async function handleAllow() {
    setStep('allowing');
    try {
      const { redirectUrl } = await approveOAuth(query);
      setStep('done');
      window.location.assign(redirectUrl); // back to Claude with the code
    } catch (err) {
      setError(err.message);
      setStep('ask');
    }
  }

  const center = { minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 3, textAlign: 'center' };

  if (error) {
    return (
      <Box sx={center}>
        <ErrorOutlineIcon sx={{ fontSize: 48, color: colors.pendingIcon }} />
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Cannot connect</Typography>
        <Typography sx={{ fontSize: 13, color: '#6B6B70' }}>{error}</Typography>
        <Typography sx={{ fontSize: 12, color: colors.muted }}>Go back to Claude and click Connect again.</Typography>
      </Box>
    );
  }

  if (!info) {
    return <Box sx={center}><CircularProgress size={28} /></Box>;
  }

  if (step === 'done') {
    return (
      <Box sx={center}>
        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: colors.primary }} />
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Connected</Typography>
        <Typography sx={{ fontSize: 13, color: '#6B6B70' }}>Going back to {info.clientName}...</Typography>
      </Box>
    );
  }

  const busy = step === 'allowing';
  return (
    <Box sx={{ ...center, alignItems: 'stretch', textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
      <Typography sx={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>
        {info.clientName} wants to access your To-Do List
      </Typography>

      {/* Which account */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mt: 1, border: `1px solid ${colors.border}`, borderRadius: '2px' }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: colors.primary, borderRadius: '2px', fontSize: 16 }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{user.name}</Typography>
          <Typography noWrap sx={{ fontSize: 12, color: colors.muted }}>{user.email}</Typography>
        </Box>
      </Box>

      {/* What it can do */}
      <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 1 }}>It will be able to:</Typography>
      {ACCESS.map((line) => (
        <Box key={line} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: colors.primary }} />
          <Typography sx={{ fontSize: 13 }}>{line}</Typography>
        </Box>
      ))}
      <Typography sx={{ fontSize: 11, color: colors.muted }}>
        You can stop this at any time: Profile → Connect to Claude → Revoke.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button fullWidth variant="outlined" disabled={busy} onClick={() => window.location.assign(info.denyUrl)}
          sx={{ py: 1.25, borderRadius: '2px', fontSize: 14 }}>
          Cancel
        </Button>
        <Button fullWidth variant="contained" disableElevation disabled={busy} onClick={handleAllow}
          startIcon={busy && <CircularProgress size={18} color="inherit" />}
          sx={{ py: 1.25, borderRadius: '2px', fontSize: 14, '&.Mui-disabled': busy ? { bgcolor: colors.primary, color: '#fff', opacity: 0.8 } : {} }}>
          {busy ? 'Allowing...' : 'Allow'}
        </Button>
      </Box>
    </Box>
  );
}
