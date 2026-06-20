const Task = require('../models/Task');

// Helper to emit socket event
const emitSocketUpdate = (req, action, task) => {
  const io = req.app.get('io');
  if (io && req.user) {
    io.to(`user_${req.user._id.toString()}`).emit('task_update', {
      action,
      task,
      timestamp: new Date(),
    });
  }
};

// @desc    Get all user tasks (with search, filter, sort, and pagination)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { search, status, category, priority, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
    
    // Build query object
    const query = { userId: req.user._id };

    // Search query (case-insensitive regex on title and description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter query parameters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Sorting
    let sort = {};
    if (sortBy) {
      // Sort Order: 'asc' = 1, 'desc' = -1
      const order = sortOrder === 'desc' ? -1 : 1;

      if (sortBy === 'priority') {
        // Special sort for priority: Custom mapping via aggregation or simple sorting by string (Low/Medium/High)
        // For standard Mongoose queries, we'll sort alphabetically or do basic sort.
        // Let's implement alphabetical/date sorting and handle priority sorting
        sort.priority = order; 
      } else if (sortBy === 'alphabetical' || sortBy === 'title') {
        sort.title = order;
      } else {
        sort[sortBy] = order; // e.g. dueDate, createdAt
      }
    } else {
      // Default sort by createdAt descending
      sort.createdAt = -1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);
    
    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, category, dueDate } = req.body;

    if (!title || !dueDate) {
      res.status(400);
      throw new Error('Please enter a title and select a due date');
    }

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      category,
      dueDate,
      userId: req.user._id,
    });

    // Emit Socket.io update to the user's room
    emitSocketUpdate(req, 'create', task);

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, category, dueDate } = req.body;

    let task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority !== undefined ? priority : task.priority;
    task.status = status !== undefined ? status : task.status;
    task.category = category !== undefined ? category : task.category;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;

    const updatedTask = await task.save();

    // Emit Socket.io update to the user's room
    emitSocketUpdate(req, 'update', updatedTask);

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    await Task.deleteOne({ _id: req.params.id });

    // Emit Socket.io update to the user's room
    emitSocketUpdate(req, 'delete', { _id: req.params.id });

    res.json({ success: true, message: 'Task removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Patch task status
// @route   PATCH /api/tasks/status/:id
// @access  Private
const patchTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400);
      throw new Error('Please provide a status');
    }

    let task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    task.status = status;
    const updatedTask = await task.save();

    // Emit Socket.io update to the user's room
    emitSocketUpdate(req, 'status_change', updatedTask);

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  patchTaskStatus,
};
