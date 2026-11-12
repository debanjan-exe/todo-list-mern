// Unit tests for the two middlewares: requireAuth and errorHandler.
// We call them with fake req / res / next objects (no Express server).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import requireAuth from '../../src/middleware/auth.js';
import errorHandler from '../../src/middleware/errorHandler.js';
import * as authService from '../../src/services/authService.js';
import { NotFoundError } from '../../src/utils/errors.js';

vi.mock('../../src/services/authService.js');

// Fake "res": remembers the status and the JSON body
function fakeRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('requireAuth', () => {
  it('gives 401 when there is no Authorization header', async () => {
    const next = vi.fn();
    await requireAuth({ headers: {} }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it('puts the user id on req.userId for a valid token of an active account', async () => {
    authService.verifyToken.mockReturnValue('u1');
    authService.checkActiveUser.mockResolvedValue();
    const req = { headers: { authorization: 'Bearer good-token' } };
    const next = vi.fn();

    await requireAuth(req, {}, next);

    expect(authService.verifyToken).toHaveBeenCalledWith('good-token');
    expect(req.userId).toBe('u1');
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it('gives 401 when the account was deleted', async () => {
    authService.verifyToken.mockReturnValue('u1');
    authService.checkActiveUser.mockRejectedValue(Object.assign(new Error('gone'), { status: 401 }));
    const next = vi.fn();
    await requireAuth({ headers: { authorization: 'Bearer old-token' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });
});

describe('errorHandler', () => {
  it('turns a Mongoose ValidationError into 400', () => {
    const res = fakeRes();
    errorHandler({ name: 'ValidationError', message: 'Title is required' }, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Title is required' });
  });

  it('turns a duplicate key error into 409', () => {
    const res = fakeRes();
    errorHandler({ code: 11000 }, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('uses the status of our own errors', () => {
    const res = fakeRes();
    errorHandler(new NotFoundError('Task not found'), {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
  });

  it('hides the real message of unknown errors (500)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = fakeRes();
    errorHandler(new Error('secret database details'), {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
  });
});
