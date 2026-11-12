// ROUTES: map each URL + HTTP method to a controller function.
import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router();

router.get('/', getTasks); //          GET    /api/tasks?search=word
router.get('/:id', getTask); //        GET    /api/tasks/:id
router.post('/', createTask); //       POST   /api/tasks
router.put('/:id', updateTask); //     PUT    /api/tasks/:id   (edit + status change)
router.delete('/:id', deleteTask); //  DELETE /api/tasks/:id

export default router;
