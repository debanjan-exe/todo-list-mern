// "Edit Profile" bottom drawer (same style as the task sheet).
// Name can change. Email is shown but disabled: it is the sign-in id, so it cannot change.
import { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Button, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const MAX_NAME = 50; // same rule as the server

const Label = ({ children }) => (
  <Typography sx={{ fontSize: 11, color: '#6B6B70', mb: 0.75, mt: 2 }}>{children}</Typography>
);

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '2px', fontSize: 13, bgcolor: '#fff' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
  '& input': { py: 1.1 },
  '& .MuiOutlinedInput-root.Mui-disabled': { bgcolor: '#F4F4F6' }, // grey box only, not the help text
};

export default function EditProfileDrawer({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fill the form each time the drawer opens
  useEffect(() => {
    if (open) {
      setName(user.name);
      setError('');
    }
  }, [open, user.name]);

  const unchanged = name.trim() === user.name;

  async function handleSave() {
    const clean = name.trim();
    if (!clean) return setError('Name is required');
    if (clean.length > MAX_NAME) return setError(`Use at most ${MAX_NAME} characters`);
    setSaving(true);
    try {
      await updateProfile(clean);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer anchor="bottom" open={open} onClose={() => !saving && onClose()}
      PaperProps={{ sx: { maxWidth: 430, mx: 'auto', borderRadius: 0 } }}>
      <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); handleSave(); }} sx={{ px: 2.5, pt: 2.5, pb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Edit Profile</Typography>
          <IconButton size="small" aria-label="Close" onClick={onClose} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Label>Name</Label>
        <TextField fullWidth autoFocus value={name} placeholder="Your name"
          onChange={(e) => { setName(e.target.value); setError(''); }}
          error={!!error} helperText={error || `${name.trim().length}/${MAX_NAME}`}
          inputProps={{ 'aria-label': 'Name', maxLength: MAX_NAME + 10 }} sx={inputSx} />

        <Label>Email</Label>
        <TextField fullWidth disabled value={user.email} sx={inputSx}
          helperText="Email cannot be changed"
          inputProps={{ 'aria-label': 'Email' }}
          InputProps={{ endAdornment: <LockOutlinedIcon sx={{ fontSize: 16, color: colors.muted }} /> }} />

        <Button type="submit" fullWidth variant="contained" disableElevation disabled={saving || unchanged}
          startIcon={saving && <CircularProgress size={18} color="inherit" />}
          sx={{ mt: 3, py: 1.25, borderRadius: '2px', fontSize: 14,
            '&.Mui-disabled': saving ? { bgcolor: colors.primary, color: '#fff', opacity: 0.8 } : {} }}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </Box>
    </Drawer>
  );
}
