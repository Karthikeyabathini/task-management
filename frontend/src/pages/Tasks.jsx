import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiColumns,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from 'react-icons/fi';

const Tasks = () => {
  const socket = useSocket();
  
  // State variables
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // Tasks per page

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // View state: 'card' | 'table' | 'kanban'
  const [viewMode, setViewMode] = useState('card');

  // Kanban drag tracking
  const [dragOverCol, setDragOverCol] = useState(null);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Construct query string
      let url = `/tasks?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (category) url += `&category=${category}`;
      if (priority) url += `&priority=${priority}`;

      const res = await api.get(url);
      if (res.data.success) {
        setTasks(res.data.tasks);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks on pagination/filter changes
  useEffect(() => {
    // Kanban view needs all tasks to display columns correctly, so bypass pagination if in Kanban
    if (viewMode === 'kanban') {
      const fetchAllKanbanTasks = async () => {
        try {
          setLoading(true);
          let url = `/tasks?limit=1000&sortBy=${sortBy}&sortOrder=${sortOrder}`;
          if (search.trim()) url += `&search=${encodeURIComponent(search)}`;
          if (category) url += `&category=${category}`;
          if (priority) url += `&priority=${priority}`;

          const res = await api.get(url);
          if (res.data.success) {
            setTasks(res.data.tasks);
            setTotal(res.data.total);
            setPages(1);
          }
        } catch (error) {
          console.error('Error fetching kanban tasks:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllKanbanTasks();
    } else {
      fetchTasks();
    }
  }, [page, search, status, category, priority, sortBy, sortOrder, viewMode]);

  // Listen to Socket.io events for real-time CRUD synchronization
  useEffect(() => {
    if (socket) {
      const handleTaskUpdate = (data) => {
        const { action, task } = data;

        setTasks((prevTasks) => {
          let updated = [...prevTasks];

          if (action === 'create') {
            // Add at top
            updated = [task, ...updated];
          } else if (action === 'update' || action === 'status_change') {
            updated = updated.map((t) => (t._id === task._id ? task : t));
          } else if (action === 'delete') {
            updated = updated.filter((t) => t._id !== task._id);
          }

          return updated;
        });

        // Trigger updates if counts/pagination might change
        if (action === 'create' || action === 'delete') {
          // Re-fetch only if in paginated views to adjust layout counts
          if (viewMode !== 'kanban') {
            fetchTasks();
          }
        }
      };

      socket.on('task_update', handleTaskUpdate);

      return () => {
        socket.off('task_update', handleTaskUpdate);
      };
    }
  }, [socket, page, viewMode]);

  // Submit Handler for Task creation/edit
  const handleTaskSubmit = async (formData) => {
    try {
      if (currentTask) {
        // Update Task
        const res = await api.put(`/tasks/${currentTask._id}`, formData);
        if (res.data.success) {
          toast.success('Task updated successfully!');
        }
      } else {
        // Create Task
        const res = await api.post('/tasks', formData);
        if (res.data.success) {
          toast.success('Task created successfully!');
        }
      }
      setModalOpen(false);
      setCurrentTask(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  // Status Patch handler (e.g. checkbox completion)
  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await api.patch(`/tasks/status/${task._id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Task marked as ${newStatus}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to change status');
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      const res = await api.delete(`/tasks/${taskToDelete._id}`);
      if (res.data.success) {
        toast.success('Task deleted successfully');
        setConfirmOpen(false);
        setTaskToDelete(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete task');
    }
  };

  // Export functions
  const exportToExcel = () => {
    if (tasks.length === 0) {
      toast.warning('No tasks to export');
      return;
    }
    const data = tasks.map((t) => ({
      Title: t.title,
      Description: t.description || '',
      Status: t.status,
      Priority: t.priority,
      Category: t.category,
      'Due Date': new Date(t.dueDate).toLocaleDateString(),
      'Created At': new Date(t.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, 'TaskFlow_Tasks.xlsx');
    toast.success('Excel export started!');
  };

  const exportToPDF = () => {
    if (tasks.length === 0) {
      toast.warning('No tasks to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(18);
    doc.text('TaskFlow - Task Summary Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 27);
    
    let y = 40;
    doc.setFontSize(11);
    
    tasks.forEach((t, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.text(`${index + 1}. ${t.title}`, 14, y);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(`Category: ${t.category} | Priority: ${t.priority} | Status: ${t.status}`, 14, y + 6);
      doc.text(`Due Date: ${new Date(t.dueDate).toLocaleDateString()}`, 14, y + 12);
      
      if (t.description) {
        doc.text(`Description: ${t.description.substring(0, 80)}`, 14, y + 18);
        y += 28;
      } else {
        y += 22;
      }
    });

    doc.save('TaskFlow_Tasks.pdf');
    toast.success('PDF export complete!');
  };

  // Drag and Drop (Kanban Board)
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e, statusColumn) => {
    e.preventDefault();
    if (dragOverCol !== statusColumn) {
      setDragOverCol(statusColumn);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    try {
      const res = await api.patch(`/tasks/status/${taskId}`, { status: targetStatus });
      if (res.data.success) {
        toast.success(`Moved to ${targetStatus}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to move task');
    }
  };

  // Helper colors for badges
  const getPriorityBadge = (prio) => {
    const styles = {
      High: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400',
      Medium: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
      Low: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400',
    };
    return styles[prio] || styles.Low;
  };

  const getStatusBadge = (stat) => {
    const styles = {
      Completed: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
      'In Progress': 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
      Pending: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    };
    return styles[stat] || styles.Pending;
  };

  // Kanban Column Splitter
  const kanbanColumns = {
    Pending: tasks.filter(t => t.status === 'Pending'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    Completed: tasks.filter(t => t.status === 'Completed'),
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add Task */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-850 dark:text-white">Workspace Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize, track, and execute your flow</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {/* Exports */}
          <div className="relative group">
            <button
              onClick={exportToExcel}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Export as Excel"
            >
              <FiDownload className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
          >
            PDF Summary
          </button>
          
          <button
            onClick={() => {
              setCurrentTask(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold text-sm shadow-md shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/20 transition-all hover:scale-105"
          >
            <FiPlus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-4 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-3.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <FiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page to 1
              }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'card' ? 'bg-white dark:bg-dark-900 shadow-md text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Card View"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white dark:bg-dark-900 shadow-md text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-white dark:bg-dark-900 shadow-md text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban Board"
            >
              <FiColumns className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Status filter (hidden if Kanban view is active since Kanban separates statuses) */}
          {viewMode !== 'kanban' && (
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white text-xs font-semibold focus:outline-none transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          )}

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="">All Categories</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Shopping">Shopping</option>
            <option value="Health">Health</option>
            <option value="Others">Others</option>
          </select>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* Sort By filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Alphabetical</option>
          </select>

          {/* Sort Order filter */}
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Central Loading / Task Rendering Area */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-850 dark:text-white">No tasks found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Try adjusting your filters, or create a brand new task to get started on your objectives.
          </p>
          <button
            onClick={() => {
              setCurrentTask(null);
              setModalOpen(true);
            }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-white font-semibold text-sm shadow-md shadow-teal-500/10 hover:bg-teal-600 transition-colors"
          >
            Create Your First Task
          </button>
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between ${
                    task.status === 'Completed' ? 'opacity-85' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Checkbox & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`p-1 rounded-lg border transition-all focus:outline-none ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                            : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/20 text-transparent'
                        }`}
                      >
                        <FiCheckCircle className="w-4.5 h-4.5" />
                      </button>
                      
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450 uppercase tracking-wide">
                          {task.category}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className={`font-bold text-slate-800 dark:text-white leading-snug ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer: Date & Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      <FiCalendar className="w-3.5 h-3.5" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>

                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setCurrentTask(task);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Task"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTaskToDelete(task);
                          setConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Task"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-10">Mark</th>
                      <th className="px-5 py-3.5">Task Title</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-sm">
                    {tasks.map((task) => (
                      <tr
                        key={task._id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${
                          task.status === 'Completed' ? 'opacity-85' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className={`p-1 rounded-md border transition-all focus:outline-none ${
                              task.status === 'Completed'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/20 text-transparent'
                            }`}
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                        </td>

                        {/* Title & description */}
                        <td className="px-5 py-3 max-w-xs">
                          <div className="font-semibold text-slate-800 dark:text-white truncate">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-slate-450 dark:text-slate-500 truncate">
                              {task.description}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-300 uppercase tracking-wider">
                            {task.category}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-450 text-xs">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                            {task.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setCurrentTask(task);
                                setModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-teal-600 dark:text-slate-450 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit"
                            >
                              <FiEdit className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTaskToDelete(task);
                                setConfirmOpen(true);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 dark:text-slate-450 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kanban Board (HTML5 Drag & Drop) */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Object.keys(kanbanColumns).map((colStatus) => {
                const colTasks = kanbanColumns[colStatus];
                const isOver = dragOverCol === colStatus;

                return (
                  <div
                    key={colStatus}
                    onDragOver={(e) => handleDragOver(e, colStatus)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, colStatus)}
                    className={`bg-slate-100/50 dark:bg-dark-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 min-h-[50vh] transition-colors flex flex-col space-y-4.5 ${
                      isOver ? 'drag-over' : ''
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            colStatus === 'Completed'
                              ? 'bg-emerald-500'
                              : colStatus === 'In Progress'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">
                          {colStatus}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-650 dark:text-slate-400">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column Body: Task Cards list */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                      {colTasks.length > 0 ? (
                        colTasks.map((task) => (
                          <div
                            key={task._id}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task._id)}
                            className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow group relative"
                          >
                            {/* Badges */}
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                {task.category}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="font-semibold text-slate-800 dark:text-white text-xs leading-snug line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Date & Action shortcuts */}
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-850">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                              
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setCurrentTask(task);
                                    setModalOpen(true);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-teal-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <FiEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setTaskToDelete(task);
                                    setConfirmOpen(true);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-rose-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-450 dark:text-slate-500 text-center py-8">
                          Drag tasks here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination (only in non-Kanban views) */}
          {viewMode !== 'kanban' && pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
              <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
                Showing page {page} of {pages} ({total} tasks total)
              </span>

              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-105 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => Math.min(p + 1, pages))}
                  className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-105 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reusable Form Modals */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentTask(null);
        }}
        onSubmit={handleTaskSubmit}
        task={currentTask}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Task"
        message={`Are you sure you want to delete the task "${taskToDelete?.title}"? This action cannot be reverted.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setTaskToDelete(null);
        }}
      />

    </div>
  );
};

export default Tasks;
