// Unit tests for the Sign Up screen checks.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import SignUp from '../../src/pages/SignUp';

const signUp = vi.fn();
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ signUp }) }));

// braces: a returned function would run as a cleanup step
beforeEach(() => {
  signUp.mockReset();
});

// Fill the four fields
async function fill({ name = 'Deb', email = 'deb@example.com', password = 'secret123', confirm = password } = {}) {
  if (name) await userEvent.type(screen.getByLabelText('Name'), name);
  if (email) await userEvent.type(screen.getByLabelText('Email'), email);
  if (password) await userEvent.type(screen.getByLabelText('Password'), password);
  if (confirm) await userEvent.type(screen.getByLabelText('Confirm password'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
}

describe('SignUp', () => {
  it('needs a name and a valid email', async () => {
    renderWithProviders(<SignUp />);
    await fill({ name: '', email: 'not-an-email' });
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('needs a password of at least 6 characters', async () => {
    renderWithProviders(<SignUp />);
    await fill({ password: '123' });
    expect(screen.getByText('Use at least 6 characters')).toBeInTheDocument();
  });

  it('needs the two passwords to match', async () => {
    renderWithProviders(<SignUp />);
    await fill({ password: 'secret123', confirm: 'secret999' });
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('signs up with valid details', async () => {
    signUp.mockResolvedValue();
    renderWithProviders(<SignUp />);
    await fill();
    expect(signUp).toHaveBeenCalledWith('Deb', 'deb@example.com', 'secret123');
  });

  it('shows "already exists" from the server', async () => {
    signUp.mockRejectedValue(new Error('An account with this email already exists'));
    renderWithProviders(<SignUp />);
    await fill();
    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });
});
