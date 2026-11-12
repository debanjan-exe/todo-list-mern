// DATA layer: the only file that runs MongoDB queries for tasks.
// No business rules here, only "read / write the database".
// Every query:
//   - is limited to ONE user (userId), so users never see each other's tasks
//   - skips soft-deleted tasks (isDeleted: true)
import Task from '../models/Task.js';

const scope = (userId) => ({ user: userId, isDeleted: false });

// Find the user's tasks. "extraFilter" adds more conditions (for example, a search).
export function findTasks(userId, extraFilter = {}) {
  return Task.find({ ...scope(userId), ...extraFilter }).sort({ dateTime: 1 }); // earliest first
}

export function findTaskById(userId, id) {
  return Task.findOne({ _id: id, ...scope(userId) });
}

export function insertTask(userId, data) {
  return Task.create({ ...data, user: userId }); // the model checks the required fields
}

export function updateTaskById(userId, id, changes) {
  return Task.findOneAndUpdate({ _id: id, ...scope(userId) }, changes, {
    new: true, // return the updated document
    runValidators: true, // apply the schema rules on update too
  });
}

// Soft delete: mark only, never remove the document
export function markTaskDeleted(userId, id) {
  return Task.findOneAndUpdate(
    { _id: id, ...scope(userId) },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
}
