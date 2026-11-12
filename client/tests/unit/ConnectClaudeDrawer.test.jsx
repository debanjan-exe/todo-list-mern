// Unit tests for the "Connect to Claude" drawer (personal access tokens for MCP).
// The API and TaskContext are mocked, so we test only what the drawer does.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import ConnectClaudeDrawer, { setupSnippets } from '../../src/components/ConnectClaudeDrawer';
import { listAccessTokens, createAccessToken, revokeAccessToken } from '../../src/api';

const notify = vi.fn();
const confirm = vi.fn();
vi.mock('../../src/context/TaskContext', () => ({ useTasks: () => ({ notify, confirm }) }));
vi.mock('../../src/api', () => ({
  listAccessTokens: vi.fn(),
  createAccessToken: vi.fn(),
  revokeAccessToken: vi.fn(),
  MCP_URL: 'https://api.example.com/mcp',
}));

const saved = { id: 't1', name: 'Laptop', prefix: 'todo_pat_abc123', lastUsedAt: null, createdAt: '2026-11-01' };

beforeEach(() => {
  vi.clearAllMocks();
  listAccessTokens.mockResolvedValue([saved]);
});

describe('ConnectClaudeDrawer', () => {
  it('lists the saved tokens (only the prefix, never the full token)', async () => {
    renderWithProviders(<ConnectClaudeDrawer open onClose={() => {}} />);
    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText(/todo_pat_abc123… · Last used: Never/)).toBeInTheDocument();
  });

  it('shows a new token one time and puts it in the setup snippet', async () => {
    createAccessToken.mockResolvedValue({ ...saved, id: 't2', name: 'Claude', token: 'todo_pat_FULLSECRET' });
    renderWithProviders(<ConnectClaudeDrawer open onClose={() => {}} />);

    await userEvent.click(screen.getByRole('tab', { name: 'With a token' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(createAccessToken).toHaveBeenCalledWith('Claude');
    expect(await screen.findByText('todo_pat_FULLSECRET')).toBeInTheDocument();
    expect(screen.getByText(/You will not see it again/)).toBeInTheDocument();
    expect(screen.getByText(/claude mcp add --transport http todo https:\/\/api.example.com\/mcp --header "Authorization: Bearer todo_pat_FULLSECRET"/)).toBeInTheDocument();
  });

  it('shows an error and does not call the API for an empty name', async () => {
    renderWithProviders(<ConnectClaudeDrawer open onClose={() => {}} />);
    await userEvent.click(screen.getByRole('tab', { name: 'With a token' }));
    await userEvent.clear(screen.getByLabelText('Token name'));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(createAccessToken).not.toHaveBeenCalled();
  });

  it('revokes a token only after the user confirms', async () => {
    confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    revokeAccessToken.mockResolvedValue({ message: 'Token revoked' });
    renderWithProviders(<ConnectClaudeDrawer open onClose={() => {}} />);

    const revoke = await screen.findByRole('button', { name: 'Revoke' });
    await userEvent.click(revoke); // user says No
    expect(revokeAccessToken).not.toHaveBeenCalled();

    await userEvent.click(revoke); // user says Yes
    await waitFor(() => expect(revokeAccessToken).toHaveBeenCalledWith('t1'));
    await waitFor(() => expect(screen.queryByText('Laptop')).not.toBeInTheDocument());
    expect(notify).toHaveBeenCalledWith('Token revoked');
  });

  it('shows one-click (OAuth) setup first: URL and Claude Code command, no token', async () => {
    listAccessTokens.mockResolvedValue([{ ...saved, viaOAuth: true, name: 'Claude' }]);
    renderWithProviders(<ConnectClaudeDrawer open onClose={() => {}} />);
    expect(screen.getByText('https://api.example.com/mcp')).toBeInTheDocument();
    expect(screen.getByText('claude mcp add --transport http todo https://api.example.com/mcp')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
    expect(await screen.findByText(/Connected app · Last used/)).toBeInTheDocument();
  });

  it('builds setup snippets for each client', () => {
    const s = setupSnippets('TKN');
    expect(Object.keys(s)).toEqual(['Claude Code', 'Claude Desktop', 'Other']);
    expect(JSON.parse(s['Claude Desktop']).mcpServers.todo.args).toContain('Authorization: Bearer TKN');
    expect(JSON.parse(s.Other)).toEqual({ url: 'https://api.example.com/mcp', headers: { Authorization: 'Bearer TKN' } });
  });
});
