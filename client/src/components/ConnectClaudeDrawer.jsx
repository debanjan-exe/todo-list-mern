// "Connect to Claude" bottom drawer.
// 1. Make a personal access token (shown ONE time, with a copy button).
// 2. Copy a setup snippet (Claude Code / Claude Desktop / other MCP client).
// 3. See the tokens and revoke one (soft delete: it stops working at once).
import { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, Button, CircularProgress, Tabs, Tab, Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { listAccessTokens, createAccessToken, revokeAccessToken, MCP_URL } from '../api';
import { useTasks } from '../context/TaskContext';
import { colors } from '../theme';

const MAX_NAME = 40; // same rule as the server
const TOKEN_HINT = '<your-token>';

// Setup text for each client. The token goes in the Authorization header.
export function setupSnippets(token = TOKEN_HINT) {
  return {
    'Claude Code': `claude mcp add --transport http todo ${MCP_URL} --header "Authorization: Bearer ${token}"`,
    'Claude Desktop': JSON.stringify(
      { mcpServers: { todo: { command: 'npx', args: ['-y', 'mcp-remote', MCP_URL, '--header', `Authorization: Bearer ${token}`] } } },
      null, 2
    ),
    Other: JSON.stringify({ url: MCP_URL, headers: { Authorization: `Bearer ${token}` } }, null, 2),
  };
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';

// Grey code box with a copy button
function CodeBox({ text, label, onCopy }) {
  return (
    <Box sx={{ position: 'relative', bgcolor: '#F4F4F6', border: `1px solid ${colors.border}`, borderRadius: '2px' }}>
      <Box component="pre" sx={{ m: 0, p: 1.5, pr: 5, fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
        {text}
      </Box>
      <IconButton size="small" aria-label={`Copy ${label}`} onClick={() => onCopy(text, label)}
        sx={{ position: 'absolute', top: 4, right: 4, color: colors.primary }}>
        <ContentCopyIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

const Heading = ({ children }) => (
  <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 2.5, mb: 1 }}>{children}</Typography>
);

export default function ConnectClaudeDrawer({ open, onClose }) {
  const { confirm, notify } = useTasks();
  const [tokens, setTokens] = useState(null); // null = loading
  const [name, setName] = useState('Claude');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState(''); // full token, shown one time
  const [client, setClient] = useState('Claude Code');

  // Load the list each time the drawer opens. Forget the last new token.
  useEffect(() => {
    if (!open) return;
    setNewToken('');
    setError('');
    setTokens(null);
    listAccessTokens().then(setTokens).catch((err) => { setTokens([]); notify(err.message); });
  }, [open, notify]);

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Cannot copy. Select the text and copy it.');
    }
  }

  async function handleCreate() {
    const clean = name.trim();
    if (!clean) return setError('Name is required');
    if (clean.length > MAX_NAME) return setError(`Use at most ${MAX_NAME} characters`);
    setCreating(true);
    try {
      const created = await createAccessToken(clean);
      setNewToken(created.token);
      const { token, ...shown } = created; // never keep the full token in the list
      setTokens((list) => [shown, ...(list || [])]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(token) {
    const ok = await confirm({
      title: 'Revoke token?',
      message: `"${token.name}" will stop working at once. AI clients that use it will lose access.`,
      confirmText: 'Revoke',
    });
    if (!ok) return;
    try {
      await revokeAccessToken(token.id);
      setTokens((list) => list.filter((t) => t.id !== token.id));
      notify('Token revoked');
    } catch (err) {
      notify(err.message);
    }
  }

  const snippet = setupSnippets(newToken || TOKEN_HINT)[client];

  return (
    <Drawer anchor="bottom" open={open} onClose={() => !creating && onClose()}
      PaperProps={{ sx: { maxWidth: 430, mx: 'auto', borderRadius: 0, maxHeight: '90dvh' } }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 'calc(24px + env(safe-area-inset-bottom))', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Connect to Claude</Typography>
          <IconButton size="small" aria-label="Close" onClick={onClose} disabled={creating}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: 12, color: '#6B6B70', mt: 0.5 }}>
          Let Claude (or another MCP client) read and change your tasks. Make a token, then add the server to your client.
        </Typography>

        {/* Step 1: token */}
        <Heading>1. Make a token</Heading>
        {newToken ? (
          <>
            <Typography sx={{ fontSize: 11, color: colors.pendingIcon, mb: 1 }}>
              Copy this token now. You will not see it again.
            </Typography>
            <CodeBox text={newToken} label="Token" onCopy={copy} />
          </>
        ) : (
          <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); handleCreate(); }} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField fullWidth size="small" value={name} placeholder="Token name, for example Claude Desktop"
              onChange={(e) => { setName(e.target.value); setError(''); }}
              error={!!error} helperText={error || ' '}
              inputProps={{ 'aria-label': 'Token name', maxLength: MAX_NAME + 10 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px', fontSize: 13 } }} />
            <Button type="submit" variant="contained" disableElevation disabled={creating}
              sx={{ borderRadius: '2px', fontSize: 13, height: 40, minWidth: 96,
                '&.Mui-disabled': { bgcolor: colors.primary, color: '#fff', opacity: 0.8 } }}>
              {creating ? <CircularProgress size={18} color="inherit" /> : 'Create'}
            </Button>
          </Box>
        )}

        {/* Step 2: setup snippet */}
        <Heading>2. Add the server</Heading>
        <Tabs value={client} onChange={(e, v) => setClient(v)} variant="fullWidth"
          sx={{ minHeight: 36, mb: 1, '& .MuiTab-root': { minHeight: 36, fontSize: 12, textTransform: 'none' } }}>
          {Object.keys(setupSnippets()).map((c) => <Tab key={c} value={c} label={c} />)}
        </Tabs>
        <CodeBox text={snippet} label="Setup" onCopy={copy} />
        <Typography sx={{ fontSize: 11, color: colors.muted, mt: 0.75 }}>
          Server URL: {MCP_URL}
        </Typography>

        {/* Step 3: list + revoke */}
        <Heading>Your tokens</Heading>
        {tokens === null ? (
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: '2px' }} />
        ) : tokens.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: colors.muted }}>No tokens yet.</Typography>
        ) : (
          tokens.map((t) => (
            <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: `1px solid ${colors.border}` }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 500 }}>{t.name}</Typography>
                <Typography noWrap sx={{ fontSize: 11, color: colors.muted }}>
                  {t.prefix}… · Last used: {formatDate(t.lastUsedAt)}
                </Typography>
              </Box>
              <Button size="small" color="error" onClick={() => handleRevoke(t)} sx={{ fontSize: 12, textTransform: 'none' }}>
                Revoke
              </Button>
            </Box>
          ))
        )}
      </Box>
    </Drawer>
  );
}
