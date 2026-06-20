const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  patchTaskStatus,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes in this router
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/status/:id', patchTaskStatus);

module.exports = router;
