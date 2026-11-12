// Shared layout and fields for the Sign In and Sign Up screens (Figma style:
// blue top band with zig-zag lines, white form, square corners, blue button).
import { useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, InputAdornment, CircularProgress, Alert } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { colors } from '../theme';

// Same input look as the task form: thin grey border, small text, square corners
const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '2px', fontSize: 13, bgcolor: '#fff' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
  '& input': { py: 1.3 },
};

// One labelled input. type="password" adds a show / hide button.
export function AuthField({ label, type = 'text', error, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <Box sx={{ mt: 2 }}>
      <Typography component="label" sx={{ display: 'block', fontSize: 11, color: '#6B6B70', mb: 0.75 }}>{label}</Typography>
      <TextField
        fullWidth
        type={isPassword && !show ? 'password' : isPassword ? 'text' : type}
        error={!!error}
        helperText={error}
        sx={inputSx}
        inputProps={{ 'aria-label': label }}
        InputProps={isPassword ? {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>
                {show ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        } : undefined}
        {...props}
      />
    </Box>
  );
}

// Page frame: blue band, title, subtitle, form, submit button, link to the other screen
export default function AuthLayout({ title, subtitle, children, onSubmit, submitText, loading, apiError, footerText, footerLink, footerTo }) {
  const handleSubmit = (e) => {
    e.preventDefault(); // stop the page reload
    onSubmit();
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Blue band (same style as Onboarding) */}
      <Box sx={{ height: 120, bgcolor: colors.primary, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 110, height: 110, borderRadius: '50%', border: '14px solid rgba(255,255,255,0.15)' }} />
        <Box component="svg" viewBox="0 0 80 50" sx={{ position: 'absolute', width: 80, bottom: 8, left: -8 }}>
          {[0, 10, 20].map((y) => (
            <path key={y} d="M0 10 L10 0 L20 10 L30 0 L40 10 L50 0 L60 10 L70 0 L80 10" transform={`translate(0 ${y + 5})`}
              fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" />
          ))}
        </Box>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ flex: 1, px: 3, pt: 4, pb: 4, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ fontSize: 22, fontWeight: 600 }}>{title}</Typography>
        <Typography sx={{ fontSize: 12, color: '#6B6B70', mt: 1 }}>{subtitle}</Typography>

        {children}

        {apiError && <Alert severity="error" sx={{ mt: 2.5, borderRadius: '2px', fontSize: 12 }}>{apiError}</Alert>}

        <Button type="submit" fullWidth variant="contained" disableElevation disabled={loading}
          startIcon={loading && <CircularProgress size={18} color="inherit" />}
          sx={{ mt: 4, py: 1.5, borderRadius: '2px', fontSize: 14, '&.Mui-disabled': { bgcolor: colors.primary, color: '#fff', opacity: 0.8 } }}>
          {loading ? 'Please wait...' : submitText}
        </Button>

        <Typography sx={{ fontSize: 12, color: '#6B6B70', textAlign: 'center', mt: 3 }}>
          {footerText}{' '}
          <Box component={RouterLink} to={footerTo} sx={{ color: colors.primary, fontWeight: 500, textDecoration: 'none' }}>
            {footerLink}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}
