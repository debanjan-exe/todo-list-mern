// Unit tests for the error boundary and the "Something went wrong" page.
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import ErrorBoundary from '../../src/components/ErrorBoundary';

// A screen that crashes while "broken" is true
const state = { broken: true };
function Screen() {
  if (state.broken) throw new Error('Boom!');
  return <p>Screen works</p>;
}

describe('ErrorBoundary', () => {
  it('shows the children when nothing crashes', () => {
    state.broken = false;
    renderWithProviders(<ErrorBoundary><Screen /></ErrorBoundary>);
    expect(screen.getByText('Screen works')).toBeInTheDocument();
  });

  it('shows "Something went wrong" instead of a blank page when a screen crashes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs the crash; keep the test output clean
    state.broken = true;
    renderWithProviders(<ErrorBoundary><Screen /></ErrorBoundary>);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();

    // The details are hidden until asked for
    await userEvent.click(screen.getByRole('button', { name: 'Show details' }));
    expect(screen.getByText('Boom!')).toBeInTheDocument();
  });

  it('"Try again" shows the screen again when the problem is gone', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    state.broken = true;
    renderWithProviders(<ErrorBoundary><Screen /></ErrorBoundary>);

    state.broken = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Screen works')).toBeInTheDocument();
  });
});
