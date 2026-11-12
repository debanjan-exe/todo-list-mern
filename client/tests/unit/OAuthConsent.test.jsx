// Unit tests for the OAuth consent page and the sign-in round trip (Claude "Connect").
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import OAuthConsent from '../../src/pages/OAuthConsent';
import PublicRoutes from '../../src/routes/PublicRoutes';
import { getOAuthConsentInfo, approveOAuth, getTestUser } from '../../src/api';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Asha', email: 'asha@mail.com' }, signIn: vi.fn() }),
}));
vi.mock('../../src/api', async (original) => ({
  ...(await original()), // keep the real save / get pending helpers
  getOAuthConsentInfo: vi.fn(),
  approveOAuth: vi.fn(),
  getTestUser: vi.fn(),
}));

const QUERY = 'client_id=abc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&state=s1';
const assign = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  Object.defineProperty(window, 'location', { value: { ...window.location, assign }, writable: true });
  getTestUser.mockRejectedValue(new Error('off')); // Sign In page: no demo account
  getOAuthConsentInfo.mockResolvedValue({ clientName: 'Claude', denyUrl: 'https://claude.ai/cb?error=access_denied&state=s1' });
});

describe('OAuthConsent', () => {
  it('shows who asks, the account and what it can do', async () => {
    renderWithProviders(<OAuthConsent />, { route: `/oauth/authorize?${QUERY}` });
    expect(await screen.findByText('Claude wants to access your To-Do List')).toBeInTheDocument();
    expect(screen.getByText('asha@mail.com')).toBeInTheDocument();
    expect(getOAuthConsentInfo).toHaveBeenCalledWith(QUERY);
  });

  it('Allow sends the same request and goes back to Claude with the code', async () => {
    approveOAuth.mockResolvedValue({ redirectUrl: 'https://claude.ai/cb?code=C&state=s1' });
    renderWithProviders(<OAuthConsent />, { route: `/oauth/authorize?${QUERY}` });

    await userEvent.click(await screen.findByRole('button', { name: 'Allow' }));

    expect(approveOAuth).toHaveBeenCalledWith(QUERY);
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?code=C&state=s1'));
  });

  it('Cancel goes back to Claude with access_denied', async () => {
    renderWithProviders(<OAuthConsent />, { route: `/oauth/authorize?${QUERY}` });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?error=access_denied&state=s1');
    expect(approveOAuth).not.toHaveBeenCalled();
  });

  it('a bad or old link shows an error and no Allow button', async () => {
    getOAuthConsentInfo.mockRejectedValue(new Error('Unknown client'));
    renderWithProviders(<OAuthConsent />, { route: `/oauth/authorize?${QUERY}` });
    expect(await screen.findByText('Cannot connect')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
  });
});

describe('signed out', () => {
  it('keeps the request and goes to Sign In', async () => {
    renderWithProviders(<PublicRoutes />, { route: `/oauth/authorize?${QUERY}` });
    expect(await screen.findByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(sessionStorage.getItem('todo_oauth_request')).toBe(QUERY);
  });
});
