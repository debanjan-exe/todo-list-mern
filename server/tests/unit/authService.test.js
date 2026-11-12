// Unit tests for the auth SERVICE: sign up, sign in, tokens, profile, delete, test user.
// The DATA layer is mocked, so no database is needed.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import * as authService from '../../src/services/authService.js';
import * as userData from '../../src/data/userData.js';

vi.mock('../../src/data/userData.js');

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe('signUp', () => {
  it('needs name, email and password', async () => {
    await expect(authService.signUp({ email: 'a@b.com' })).rejects.toMatchObject({ status: 400 });
  });

  it('needs a password of at least 6 characters', async () => {
    await expect(authService.signUp({ name: 'A', email: 'a@b.com', password: '123' })).rejects.toMatchObject({ status: 400 });
  });

  it('refuses an email that is already used (409)', async () => {
    userData.findUserByEmail.mockResolvedValue({ _id: 'u1' });
    await expect(authService.signUp({ name: 'A', email: 'a@b.com', password: 'secret1' })).rejects.toMatchObject({ status: 409 });
    expect(userData.insertUser).not.toHaveBeenCalled();
  });

  it('stores a bcrypt hash, never the real password, and returns a token', async () => {
    userData.findUserByEmail.mockResolvedValue(null);
    userData.insertUser.mockImplementation(async (data) => ({ _id: 'u1', ...data }));

    const result = await authService.signUp({ name: 'Asha', email: 'asha@mail.com', password: 'secret1' });

    const saved = userData.insertUser.mock.calls[0][0];
    expect(saved.password).not.toBe('secret1');
    expect(await bcrypt.compare('secret1', saved.password)).toBe(true);
    expect(result.token).toEqual(expect.any(String));
    expect(result.user).toEqual({ id: 'u1', name: 'Asha', email: 'asha@mail.com', isTestUser: false });
  });
});

describe('signIn', () => {
  const hash = bcrypt.hashSync('secret1', 4);

  it('signs in with the right password', async () => {
    userData.findUserByEmail.mockResolvedValue({ _id: 'u1', name: 'Asha', email: 'asha@mail.com', password: hash });
    const result = await authService.signIn({ email: 'asha@mail.com', password: 'secret1' });
    expect(authService.verifyToken(result.token)).toBe('u1'); // the token holds the user id
    expect(result.user).not.toHaveProperty('password');
  });

  it('gives the SAME 401 message for a wrong password and an unknown email', async () => {
    userData.findUserByEmail.mockResolvedValueOnce({ _id: 'u1', password: hash });
    const wrongPassword = authService.signIn({ email: 'asha@mail.com', password: 'nope' });
    await expect(wrongPassword).rejects.toMatchObject({ status: 401, message: 'Email or password is wrong' });

    userData.findUserByEmail.mockResolvedValueOnce(null);
    const unknownEmail = authService.signIn({ email: 'who@mail.com', password: 'nope' });
    await expect(unknownEmail).rejects.toMatchObject({ status: 401, message: 'Email or password is wrong' });
  });
});

describe('verifyToken', () => {
  it('throws 401 for a wrong token', () => {
    expect(() => authService.verifyToken('not-a-token')).toThrow(expect.objectContaining({ status: 401 }));
  });
});

describe('updateMe (edit profile)', () => {
  it('changes only the trimmed name; the email is ignored', async () => {
    userData.updateUserById.mockResolvedValue({ _id: 'u1', name: 'Asha K', email: 'asha@mail.com' });
    const user = await authService.updateMe('u1', { name: '  Asha K  ', email: 'new@mail.com' });
    expect(userData.updateUserById).toHaveBeenCalledWith('u1', { name: 'Asha K' });
    expect(user.email).toBe('asha@mail.com');
  });

  it('refuses an empty name or a name longer than 50 characters', async () => {
    await expect(authService.updateMe('u1', { name: '   ' })).rejects.toMatchObject({ status: 400 });
    await expect(authService.updateMe('u1', { name: 'x'.repeat(51) })).rejects.toMatchObject({ status: 400 });
    expect(userData.updateUserById).not.toHaveBeenCalled();
  });
});

describe('deleteMe (soft delete)', () => {
  it('marks the account as deleted', async () => {
    userData.findUserById.mockResolvedValue({ _id: 'u1', isTestUser: false });
    await authService.deleteMe('u1');
    expect(userData.markUserDeleted).toHaveBeenCalledWith('u1');
  });

  it('does not allow deleting the test account (403)', async () => {
    userData.findUserById.mockResolvedValue({ _id: 't1', isTestUser: true });
    await expect(authService.deleteMe('t1')).rejects.toMatchObject({ status: 403 });
    expect(userData.markUserDeleted).not.toHaveBeenCalled();
  });

  it('gives 401 when the account does not exist any more', async () => {
    userData.findUserById.mockResolvedValue(null);
    await expect(authService.deleteMe('u1')).rejects.toMatchObject({ status: 401 });
  });
});

describe('test user', () => {
  it('upserts ONE test user with a hashed password', async () => {
    userData.upsertTestUser.mockImplementation(async (data) => data);
    const user = await authService.ensureTestUser();
    expect(userData.upsertTestUser).toHaveBeenCalledTimes(1);
    expect(user.email).toBe('test@todo.app');
    expect(await bcrypt.compare('Test@1234', user.password)).toBe(true);
  });

  it('does nothing when TEST_USER_ENABLED=false', async () => {
    vi.stubEnv('TEST_USER_ENABLED', 'false');
    expect(await authService.ensureTestUser()).toBeNull();
    expect(userData.upsertTestUser).not.toHaveBeenCalled();
    expect(() => authService.getTestUserForSignIn()).toThrow(expect.objectContaining({ status: 404 }));
  });

  it('leaves a normal account alone if it already uses the test email', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    userData.upsertTestUser.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 11000 }));
    expect(await authService.ensureTestUser()).toBeNull();
  });

  it('uses the email and password from .env', () => {
    vi.stubEnv('TEST_USER_EMAIL', 'Demo@Mail.com');
    vi.stubEnv('TEST_USER_PASSWORD', 'Demo123');
    expect(authService.getTestUserForSignIn()).toEqual({ email: 'demo@mail.com', password: 'Demo123' });
  });
});
