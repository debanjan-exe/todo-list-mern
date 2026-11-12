// SERVICE layer: business rules for tasks.
// It knows nothing about HTTP (no req / res) and runs no MongoDB queries itself.
// It checks the input, decides what to do, and calls the DATA layer.
//
// Rules in this file:
//   - every function works for ONE user (userId comes from the auth token)
//   - an invalid or unknown id -> 404 (NotFoundError), also for another user's task
//   - search looks in title AND description, not case-sensitive
//   - the client cannot set user / isDeleted / deletedAt / _id / timestamps
//   - delete is a SOFT delete (the data layer only marks the task)
import mongoose from 'mongoose';
import * as taskData from '../data/taskData.js';
import { NotFoundError } from '../utils/errors.js';

// Throw 404 if the id is not a valid MongoDB ObjectId
function checkId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Task not found');
}

// Throw 404 if the task was not found
function found(task) {
  if (!task) throw new NotFoundError('Task not found');
  return task;
}

// Escape special regex characters so search text is treated literally
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Remove the fields the client must not change
const cleanData = ({ user, isDeleted, deletedAt, _id, createdAt, updatedAt, ...rest }) => rest;

// List the user's tasks. Optional search in title and description.
export function listTasks(userId, search = '') {
  if (!search.trim()) return taskData.findTasks(userId);
  const regex = new RegExp(escapeRegex(search.trim()), 'i'); // case-insensitive
  return taskData.findTasks(userId, { $or: [{ title: regex }, { description: regex }] });
}

export async function getTaskById(userId, id) {
  checkId(id);
  return found(await taskData.findTaskById(userId, id));
}

export function createTask(userId, data) {
  return taskData.insertTask(userId, cleanData(data));
}

// Edit fields or change status. A deleted task cannot be edited (404).
export async function updateTask(userId, id, data) {
  checkId(id);
  return found(await taskData.updateTaskById(userId, id, cleanData(data)));
}

// Soft delete
export async function deleteTask(userId, id) {
  checkId(id);
  return found(await taskData.markTaskDeleted(userId, id));
}
