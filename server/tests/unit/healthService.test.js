// Unit tests for the server status (GET /api/health) logic.
// The database helpers and the data layer are mocked.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStatus } from '../../src/services/healthService.js';
import * as db from '../../src/config/db.js';
import * as userData from '../../src/data/userData.js';

vi.mock('../../src/config/db.js');
vi.mock('../../src/data/userData.js');

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe('getStatus', () => {
  it('is "ok" when the database answers and the test user exists', async () => {
    db.dbState.mockReturnValue('connected');
    db.pingDb.mockResolvedValue(4);
    userData.countTestUsers.mockResolvedValue(1);

    const status = await getStatus();

    expect(status.status).toBe('ok');
    expect(status.checks.api.status).toBe('up');
    expect(status.checks.database).toMatchObject({ status: 'up', latencyMs: 4 });
    expect(status.checks.auth.status).toBe('up');
    expect(status.checks.testUser.status).toBe('up');
  });

  it('is "error" when MongoDB is not connected (no ping is sent)', async () => {
    db.dbState.mockReturnValue('disconnected');
    const status = await getStatus();
    expect(status.status).toBe('error');
    expect(status.checks.database).toMatchObject({ status: 'down', message: 'MongoDB is disconnected' });
    expect(db.pingDb).not.toHaveBeenCalled();
  });

  it('is "error" when the database ping fails', async () => {
    db.dbState.mockReturnValue('connected');
    db.pingDb.mockRejectedValue(new Error('no answer'));
    const status = await getStatus();
    expect(status.checks.database.status).toBe('down');
  });

  it('is "error" when JWT_SECRET is missing', async () => {
    vi.stubEnv('JWT_SECRET', '');
    db.dbState.mockReturnValue('connected');
    db.pingDb.mockResolvedValue(1);
    const status = await getStatus();
    expect(status.checks.auth.status).toBe('down');
    expect(status.status).toBe('error');
  });

  it('only WARNS when the test user is missing (the app still works)', async () => {
    db.dbState.mockReturnValue('connected');
    db.pingDb.mockResolvedValue(1);
    userData.countTestUsers.mockResolvedValue(0);
    const status = await getStatus();
    expect(status.checks.testUser.status).toBe('warn');
    expect(status.status).toBe('ok');
  });

  it('shows the test user as "off" when it is turned off', async () => {
    vi.stubEnv('TEST_USER_ENABLED', 'false');
    db.dbState.mockReturnValue('connected');
    db.pingDb.mockResolvedValue(1);
    const status = await getStatus();
    expect(status.checks.testUser.status).toBe('off');
  });
});
