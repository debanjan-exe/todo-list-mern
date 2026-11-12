// Unit tests for the Sign In screen.
// useAuth and the API are mocked, so we test only what the screen does.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import SignIn from '../../src/pages/SignIn';
import { getTestUser } from '../../src/api';

const signIn = vi.fn();
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ signIn }) }));
vi.mock('../../src/api', () => ({ getTestUser: vi.fn() }));

beforeEach(() => {
  signIn.mockReset();
  getTestUser.mockReset();
});

describe('SignIn', () => {
  it('fills in the test account from the server', async () => {
    getTestUser.mockResolvedValue({ email: 'test@todo.app', password: 'Test@1234' });
    renderWithProviders(<SignIn />);

    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveValue('test@todo.app'));
    expect(screen.getByLabelText('Password')).toHaveValue('Test@1234');
    expect(screen.getByText(/Test account filled in/)).toBeInTheDocument();
  });

  it('shows field errors and does not call the server when the form is empty', async () => {
    getTestUser.mockRejectedValue(new Error('off'));
    renderWithProviders(<SignIn />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('removes a field error as soon as the user types', async () => {
    getTestUser.mockRejectedValue(new Error('off'));
    renderWithProviders(<SignIn />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await userEvent.type(screen.getByLabelText('Password'), 'x');
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('signs in with the trimmed email', async () => {
    getTestUser.mockRejectedValue(new Error('off'));
    signIn.mockResolvedValue();
    renderWithProviders(<SignIn />);

    await userEvent.type(screen.getByLabelText('Email'), '  deb@example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(signIn).toHaveBeenCalledWith('deb@example.com', 'secret123');
  });

  it('shows the server error, for example a wrong password', async () => {
    getTestUser.mockRejectedValue(new Error('off'));
    signIn.mockRejectedValue(new Error('Email or password is wrong'));
    renderWithProviders(<SignIn />);

    await userEvent.type(screen.getByLabelText('Email'), 'deb@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Email or password is wrong')).toBeInTheDocument();
  });
});
