// MCP tools: what an AI client (for example Claude) can do with the signed-in user's tasks.
// Each tool is a thin wrapper around the SAME services the REST API uses,
// so all rules (ownership, soft delete, validation) are in one place.
import { z } from 'zod';
import * as taskService from '../services/taskService.js';
import * as authService from '../services/authService.js';

// ---- small helpers ----

// Only the fields an AI needs (no internal fields such as isDeleted)
const toTask = (t) => ({
  id: String(t._id),
  title: t.title,
  description: t.description,
  dateTime: t.dateTime,
  endTime: t.endTime || null,
  priority: t.priority,
  status: t.status,
});

// MCP tool result: JSON text the model can read
const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });

// Turn a service error (400 / 404 ...) into a tool error the model can see and fix
async function run(fn) {
  try {
    return ok(await fn());
  } catch (err) {
    if (!err.status && err.name !== 'ValidationError') throw err; // real server errors go up
    return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
  }
}

// ---- input rules (zod) ----
const isoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Use ISO 8601, for example 2026-11-12T09:00:00+05:30')
  .describe('Date and time in ISO 8601 WITH the time zone offset, for example 2026-11-12T09:00:00+05:30');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm (24-hour)').describe('End time, 24-hour HH:mm, for example 16:30');
const priority = z.enum(['Low', 'Medium', 'High']);
const status = z.enum(['In Progress', 'Completed']);
const id = z.string().describe('Task id (from list_tasks or search_tasks)');

// ---- tools ----
export function registerTaskTools(server, userId) {
  server.registerTool(
    'get_profile',
    {
      title: 'Who am I',
      description: 'Name and email of the signed-in user.',
      annotations: { readOnlyHint: true },
    },
    () => run(() => authService.getMe(userId))
  );

  server.registerTool(
    'list_tasks',
    {
      title: 'List tasks',
      description:
        'List the user\'s tasks, earliest first. Filter by a date range (from / to) and status. ' +
        'For "this week", use Monday 00:00 to Sunday 23:59:59 in the user\'s time zone.',
      inputSchema: {
        from: isoDateTime.optional(),
        to: isoDateTime.optional(),
        status: status.optional(),
      },
      annotations: { readOnlyHint: true },
    },
    (args) => run(async () => (await taskService.queryTasks(userId, args)).map(toTask))
  );

  server.registerTool(
    'search_tasks',
    {
      title: 'Search tasks',
      description: 'Find tasks whose title or description contains the text (not case-sensitive).',
      inputSchema: { query: z.string().min(1).describe('Text to search for') },
      annotations: { readOnlyHint: true },
    },
    ({ query }) => run(async () => (await taskService.queryTasks(userId, { search: query })).map(toTask))
  );

  server.registerTool(
    'create_task',
    {
      title: 'Create task',
      description: 'Create a task. Title and dateTime (date + start time) are required.',
      inputSchema: {
        title: z.string().min(1).max(200),
        dateTime: isoDateTime,
        endTime: hhmm.optional(),
        priority: priority.optional().describe('Default: Medium'),
        description: z.string().max(2000).optional(),
      },
    },
    (args) => run(async () => toTask(await taskService.createTask(userId, args)))
  );

  server.registerTool(
    'update_task',
    {
      title: 'Update task',
      description: 'Change one or more fields of a task. Send only the fields to change.',
      inputSchema: {
        id,
        title: z.string().min(1).max(200).optional(),
        dateTime: isoDateTime.optional(),
        endTime: hhmm.optional(),
        priority: priority.optional(),
        status: status.optional(),
        description: z.string().max(2000).optional(),
      },
      annotations: { idempotentHint: true },
    },
    ({ id: taskId, ...changes }) => run(async () => toTask(await taskService.updateTask(userId, taskId, changes)))
  );

  server.registerTool(
    'complete_task',
    {
      title: 'Complete task',
      description: 'Mark a task as Completed (or back to In Progress with completed: false).',
      inputSchema: { id, completed: z.boolean().default(true) },
      annotations: { idempotentHint: true },
    },
    ({ id: taskId, completed }) =>
      run(async () => toTask(await taskService.updateTask(userId, taskId, { status: completed ? 'Completed' : 'In Progress' })))
  );

  server.registerTool(
    'delete_task',
    {
      title: 'Delete task',
      description: 'Delete a task. It is hidden from the user (soft delete: kept in the database). Ask the user before deleting.',
      inputSchema: { id },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id: taskId }) =>
      run(async () => {
        await taskService.deleteTask(userId, taskId);
        return { deleted: true, id: taskId };
      })
  );

  server.registerTool(
    'weekly_summary',
    {
      title: 'Weekly summary',
      description:
        'Numbers for a period (normally one week, Monday to Sunday): total, completed, open, completion %, ' +
        'open high-priority tasks and overdue tasks.',
      inputSchema: { from: isoDateTime, to: isoDateTime },
      annotations: { readOnlyHint: true },
    },
    (args) => run(() => taskService.summarizeTasks(userId, args))
  );
}
