// Unit tests for the task SERVICE (business rules).
// The DATA layer is mocked, so no database is needed: we only check the rules
// and what the service asks the data layer to do.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as taskService from '../../src/services/taskService.js';
import * as taskData from '../../src/data/taskData.js';

vi.mock('../../src/data/taskData.js'); // every function becomes a mock (vi.fn)

const USER = 'user-1';
const VALID_ID = '64b000000000000000000001';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listTasks', () => {
  it('lists all tasks of the user when there is no search', async () => {
    taskData.findTasks.mockResolvedValue([{ title: 'A' }]);
    const tasks = await taskService.listTasks(USER);
    expect(taskData.findTasks).toHaveBeenCalledWith(USER);
    expect(tasks).toEqual([{ title: 'A' }]);
  });

  it('searches title OR description, not case-sensitive', async () => {
    await taskService.listTasks(USER, '  Wire ');
    const [, filter] = taskData.findTasks.mock.calls[0];
    const [titleRule, descriptionRule] = filter.$or;
    expect(titleRule.title.test('finishing WIREFRAME')).toBe(true);
    expect(descriptionRule.description.test('wire')).toBe(true);
  });

  it('treats regex characters in the search as normal text', async () => {
    await taskService.listTasks(USER, 'a.b(');
    const regex = taskData.findTasks.mock.calls[0][1].$or[0].title;
    expect(regex.test('a.b(')).toBe(true);
    expect(regex.test('axb(')).toBe(false); // "." is not "any character"
  });
});

describe('getTaskById', () => {
  it('throws 404 for an id that is not a MongoDB id (no database call)', async () => {
    await expect(taskService.getTaskById(USER, 'abc')).rejects.toMatchObject({ status: 404 });
    expect(taskData.findTaskById).not.toHaveBeenCalled();
  });

  it('throws 404 when the task is not found (or belongs to another user)', async () => {
    taskData.findTaskById.mockResolvedValue(null);
    await expect(taskService.getTaskById(USER, VALID_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('returns the task of this user', async () => {
    taskData.findTaskById.mockResolvedValue({ _id: VALID_ID });
    await expect(taskService.getTaskById(USER, VALID_ID)).resolves.toEqual({ _id: VALID_ID });
    expect(taskData.findTaskById).toHaveBeenCalledWith(USER, VALID_ID);
  });
});

describe('createTask / updateTask', () => {
  it('removes fields the client must not set (user, isDeleted, _id, ...)', async () => {
    await taskService.createTask(USER, {
      title: 'Task', user: 'hacker', isDeleted: true, deletedAt: 'x', _id: 'x', createdAt: 'x', updatedAt: 'x',
    });
    expect(taskData.insertTask).toHaveBeenCalledWith(USER, { title: 'Task' });
  });

  it('updates with the cleaned data and returns the task', async () => {
    taskData.updateTaskById.mockResolvedValue({ status: 'Completed' });
    const task = await taskService.updateTask(USER, VALID_ID, { status: 'Completed', user: 'other' });
    expect(taskData.updateTaskById).toHaveBeenCalledWith(USER, VALID_ID, { status: 'Completed' });
    expect(task.status).toBe('Completed');
  });

  it('throws 404 when updating a missing or deleted task', async () => {
    taskData.updateTaskById.mockResolvedValue(null);
    await expect(taskService.updateTask(USER, VALID_ID, {})).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteTask (soft delete)', () => {
  it('only marks the task as deleted', async () => {
    taskData.markTaskDeleted.mockResolvedValue({ _id: VALID_ID, isDeleted: true });
    await taskService.deleteTask(USER, VALID_ID);
    expect(taskData.markTaskDeleted).toHaveBeenCalledWith(USER, VALID_ID);
  });

  it('throws 404 when the task is already deleted', async () => {
    taskData.markTaskDeleted.mockResolvedValue(null);
    await expect(taskService.deleteTask(USER, VALID_ID)).rejects.toMatchObject({ status: 404 });
  });
});
