// CONTROLLER layer: handles HTTP only.
// It reads the request, calls the service, and sends the JSON response.
// No database code here. Errors go to the central error handler (see index.js).
// req.userId is set by middleware/auth.js (the signed-in user).
import asyncHandler from '../utils/asyncHandler.js';
import * as taskService from '../services/taskService.js';

// GET /api/tasks?search=word
export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.userId, req.query.search || '');
  res.json(tasks);
});

// GET /api/tasks/:id
export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.userId, req.params.id);
  res.json(task);
});

// POST /api/tasks
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.userId, req.body);
  res.status(201).json(task);
});

// PUT /api/tasks/:id  (edit fields or change status)
export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.userId, req.params.id, req.body);
  res.json(task);
});

// DELETE /api/tasks/:id  (soft delete)
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.userId, req.params.id);
  res.json({ message: 'Task deleted', id: task._id });
});
