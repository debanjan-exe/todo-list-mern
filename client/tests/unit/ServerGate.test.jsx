// Unit tests for the startup check (ServerGate).
// getHealth is mocked, and fake timers skip the waiting.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithProviders } from '../renderWithProviders';
import ServerGate from '../../src/components/startup/ServerGate';
import { getHealth } from '../../src/api';

vi.mock('../../src/api', () => ({ getHealth: vi.fn() }));

const healthy = {
  status: 'ok',
  checks: {
    api: { status: 'up' },
    database: { status: 'up', latencyMs: 3 },
    auth: { status: 'up' },
    testUser: { status: 'up' },
  },
};

// Let the promise finish and move the fake clock forward
const wait = (ms) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
  getHealth.mockReset();
});
afterEach(() => vi.useRealTimers());

const renderGate = () => renderWithProviders(<ServerGate><p>The app</p></ServerGate>);

describe('ServerGate', () => {
  it('shows the app after all checks pass, and remembers it for this session', async () => {
    getHealth.mockResolvedValue(healthy);
    renderGate();

    expect(screen.getByText('Checking the server')).toBeInTheDocument();
    expect(screen.queryByText('The app')).not.toBeInTheDocument();

    await wait(1500); // minimum show time
    expect(screen.getByText('All systems ready')).toBeInTheDocument();
    expect(screen.getByText('3 ms')).toBeInTheDocument(); // database ping

    await wait(1500); // "all ready" + fade out
    expect(screen.getByText('The app')).toBeInTheDocument();
    expect(sessionStorage.getItem('todo_server_checked')).toBe('1');
  });

  it('skips the check when it already passed in this session', () => {
    sessionStorage.setItem('todo_server_checked', '1');
    renderGate();
    expect(screen.getByText('The app')).toBeInTheDocument();
    expect(getHealth).not.toHaveBeenCalled();
  });

  it('shows the reason and a countdown when the server cannot be reached', async () => {
    getHealth.mockRejectedValue(new Error('Failed to fetch'));
    renderGate();

    await wait(1500);
    expect(screen.getByText(/cannot reach the server/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again \(\d+s\)/ })).toBeInTheDocument();
    expect(sessionStorage.getItem('todo_server_checked')).toBeNull();
  });

  it('shows which part is down, then tries again by itself', async () => {
    getHealth.mockResolvedValueOnce({
      status: 'error',
      checks: { ...healthy.checks, database: { status: 'down', message: 'MongoDB is disconnected' } },
    });
    getHealth.mockResolvedValue(healthy);
    renderGate();

    await wait(1500);
    expect(screen.getByText('MongoDB is disconnected')).toBeInTheDocument();

    await wait(5000); // automatic retry after 5 s
    expect(getHealth).toHaveBeenCalledTimes(2);
    await wait(3000);
    expect(screen.getByText('The app')).toBeInTheDocument();
  });
});
