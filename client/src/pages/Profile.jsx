// Profile screen: who is signed in, edit profile, task numbers, Connect to Claude (MCP), Sign out, Delete account.
import { useState } from 'react';
import { Box, Typography, Button, Avatar, IconButton, CircularProgress } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ScreenLayout from '../components/ScreenLayout';
import EditProfileDrawer from '../components/EditProfileDrawer';
import ConnectClaudeDrawer from '../components/ConnectClaudeDrawer';
import { EditIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { colors } from '../theme';

function Stat({ label, value, bg, color }) {
  return (
    <Box sx={{ flex: 1, bgcolor: bg, p: 1.5, borderRadius: '2px', textAlign: 'center' }}>
      <Typography sx={{ fontSize: 20, fontWeight: 600, color }}>{value}</Typography>
      <Typography sx={{ fontSize: 11, color: '#6B6B70' }}>{label}</Typography>
    </Box>
  );
}

export default function Profile() {
  const { user, signOut, deleteAccount } = useAuth();
  const { tasks, confirm, notify } = useTasks();
  const [editOpen, setEditOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const completed = tasks.filter((t) => t.status === 'Completed').length;

  // Ask first, then sign out (routes/index.jsx then shows the public pages)
  async function handleSignOut() {
    const ok = await confirm({ title: 'Sign out?', message: `You are signed in as ${user.email}.`, confirmText: 'Sign out' });
    if (ok) signOut();
  }

  // Ask first, then delete the account (soft delete on the server) and sign out
  async function handleDeleteAccount() {
    const ok = await confirm({
      title: 'Delete account?',
      message: `Your account (${user.email}) will be deleted and you will be signed out. You will not be able to sign in with it again.`,
      confirmText: 'Delete account',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount(); // on success the app shows the public pages
    } catch (err) {
      notify(err.message);
      setDeleting(false);
    }
  }

  return (
    <ScreenLayout header={<Typography sx={{ fontSize: 16, fontWeight: 600, pb: 2 }}>Profile</Typography>}>
      {/* Name + email + edit icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: colors.primary, fontSize: 22, borderRadius: '2px' }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: 16, fontWeight: 600 }}>{user.name}</Typography>
          <Typography noWrap sx={{ fontSize: 12, color: colors.muted }}>{user.email}</Typography>
          {user.isTestUser && (
            <Box sx={{ display: 'inline-block', mt: 0.5, px: 1, py: 0.25, fontSize: 10, fontWeight: 600, borderRadius: '2px', bgcolor: '#FFF4DB', color: '#A26A00' }}>
              TEST ACCOUNT
            </Box>
          )}
        </Box>
        <IconButton aria-label="Edit profile" onClick={() => setEditOpen(true)} sx={{ color: colors.primary, alignSelf: 'flex-start' }}>
          <EditIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Task numbers (all weeks) */}
      <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 3, mb: 1.5 }}>Your tasks</Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Stat label="Total" value={tasks.length} bg="#F4F4F6" color={colors.text} />
        <Stat label="Completed" value={completed} bg={colors.completeBg} color={colors.primary} />
        <Stat label="Open" value={tasks.length - completed} bg={colors.pendingBg} color={colors.pendingIcon} />
      </Box>

      {/* AI access: personal access tokens for the MCP server (/mcp) */}
      <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 3, mb: 0.5 }}>AI assistant</Typography>
      <Typography sx={{ fontSize: 11, color: colors.muted, mb: 1.5 }}>
        Manage your tasks from Claude with MCP.
      </Typography>
      <Button fullWidth variant="outlined" startIcon={<HubOutlinedIcon />} onClick={() => setConnectOpen(true)} disabled={deleting}
        sx={{ py: 1.25, borderRadius: '2px', fontSize: 14 }}>
        Connect to Claude
      </Button>

      <Button fullWidth variant="outlined" startIcon={<LogoutIcon />} onClick={handleSignOut} disabled={deleting}
        sx={{ mt: 4, py: 1.25, borderRadius: '2px', fontSize: 14 }}>
        Sign out
      </Button>

      {/* Danger zone: delete the account (soft delete). The test account cannot be deleted. */}
      <Box sx={{ mt: 4, pt: 2.5, borderTop: `1px solid ${colors.border}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.pendingIcon }}>Danger zone</Typography>
        <Typography sx={{ fontSize: 11, color: colors.muted, mt: 0.5, mb: 1.5 }}>
          {user.isTestUser
            ? 'The test account cannot be deleted.'
            : 'Delete your account. You will be signed out and cannot sign in with it again.'}
        </Typography>
        <Button fullWidth variant="contained" color="error" disableElevation onClick={handleDeleteAccount}
          disabled={deleting || user.isTestUser}
          startIcon={deleting && <CircularProgress size={18} color="inherit" />}
          sx={{ py: 1.25, borderRadius: '2px', fontSize: 14 }}>
          {deleting ? 'Deleting...' : 'Delete this account'}
        </Button>
      </Box>

      <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} />
      <ConnectClaudeDrawer open={connectOpen} onClose={() => setConnectOpen(false)} />
    </ScreenLayout>
  );
}
