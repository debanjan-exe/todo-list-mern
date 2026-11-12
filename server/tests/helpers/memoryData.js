// In-memory version of the DATA layer (users, tasks, tokens) for integration tests.
// Same function names and rules as src/data/*.js (user scope, soft delete),
// so the real routes, controllers and services run without MongoDB.
import mongoose from 'mongoose';

export const db = { users: [], tasks: [], tokens: [] };
export const resetDb = () => { db.users = []; db.tasks = []; db.tokens = []; };

const newId = () => new mongoose.Types.ObjectId();
const same = (a, b) => String(a) === String(b);
const now = () => new Date();

// Simple matcher for the filters the services build ($gte / $lte, $or with regex, equality)
function matches(doc, filter) {
  return Object.entries(filter).every(([key, rule]) => {
    if (key === '$or') return rule.some((part) => matches(doc, part));
    if (rule instanceof RegExp) return rule.test(doc[key] ?? '');
    if (rule && typeof rule === 'object' && !(rule instanceof Date) && !mongoose.isValidObjectId(rule)) {
      const value = new Date(doc[key]);
      if (rule.$gte && value < rule.$gte) return false;
      if (rule.$lte && value > rule.$lte) return false;
      return true;
    }
    return same(doc[key], rule);
  });
}

export const userData = {
  findUserByEmail: async (email) => db.users.find((u) => u.email === email.toLowerCase().trim() && !u.isDeleted) || null,
  findUserById: async (id) => db.users.find((u) => same(u._id, id) && !u.isDeleted) || null,
  insertUser: async (data) => {
    const user = { _id: newId(), isTestUser: false, isDeleted: false, ...data, email: data.email.toLowerCase().trim() };
    db.users.push(user);
    return user;
  },
  updateUserById: async (id, changes) => {
    const user = await userData.findUserById(id);
    return user ? Object.assign(user, changes) : null;
  },
  markUserDeleted: async (id) => {
    const user = await userData.findUserById(id);
    return user ? Object.assign(user, { isDeleted: true, deletedAt: now() }) : null;
  },
  upsertTestUser: async () => null,
  countTestUsers: async () => 0,
  prepareUserCollection: async () => {},
};

const activeTasks = (userId) => db.tasks.filter((t) => same(t.user, userId) && !t.isDeleted);

export const taskData = {
  findTasks: async (userId, extra = {}) =>
    activeTasks(userId).filter((t) => matches(t, extra)).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)),
  findTaskById: async (userId, id) => activeTasks(userId).find((t) => same(t._id, id)) || null,
  insertTask: async (userId, data) => {
    if (!data.title || !data.dateTime) throw Object.assign(new Error('Title and date are required'), { name: 'ValidationError' });
    const task = { _id: newId(), description: '', endTime: '', priority: 'Medium', status: 'In Progress', isDeleted: false, ...data, user: userId, dateTime: new Date(data.dateTime) };
    db.tasks.push(task);
    return task;
  },
  updateTaskById: async (userId, id, changes) => {
    const task = await taskData.findTaskById(userId, id);
    return task ? Object.assign(task, changes) : null;
  },
  markTaskDeleted: async (userId, id) => {
    const task = await taskData.findTaskById(userId, id);
    return task ? Object.assign(task, { isDeleted: true, deletedAt: now() }) : null;
  },
};

export const tokenData = {
  insertToken: async (data) => {
    const token = { _id: newId(), lastUsedAt: null, isDeleted: false, createdAt: now(), ...data };
    db.tokens.push(token);
    return token;
  },
  findActiveTokenByHash: async (hash) => db.tokens.find((t) => t.tokenHash === hash && !t.isDeleted) || null,
  listTokens: async (userId) => db.tokens.filter((t) => same(t.user, userId) && !t.isDeleted),
  countTokens: async (userId) => db.tokens.filter((t) => same(t.user, userId) && !t.isDeleted).length,
  markTokenRevoked: async (userId, id) => {
    const token = db.tokens.find((t) => same(t._id, id) && same(t.user, userId) && !t.isDeleted);
    return token ? Object.assign(token, { isDeleted: true, deletedAt: now() }) : null;
  },
  touchToken: async (id) => {
    const token = db.tokens.find((t) => same(t._id, id));
    if (token) token.lastUsedAt = now();
  },
};
