import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

const TaskModal = ({ isOpen, onClose, onSubmit, task = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
    category: 'Others',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      // Parse ISO date to YYYY-MM-DD
      const dateOnly = task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '';

      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: dateOnly,
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        category: task.category || 'Others',
      });
    } else {
      // Reset form on creation
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0], // Default to today
        priority: 'Medium',
        status: 'Pending',
        category: 'Others',
      });
    }
    setErrors({});
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = 'Title is required';
    if (formData.title.length > 100) tempErrors.title = 'Title cannot exceed 100 characters';
    if (!formData.dueDate) tempErrors.dueDate = 'Due Date is required';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const categories = ['Personal', 'Work', 'Study', 'Shopping', 'Health', 'Others'];
  const priorities = ['Low', 'Medium', 'High'];
  const statuses = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-dark-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Launch marketing campaign"
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.title
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
              } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Brief details about the task..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Due Date *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.dueDate
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
              } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
            />
            {errors.dueDate && <p className="text-xs text-rose-500 mt-1">{errors.dueDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                {priorities.map((prio) => (
                  <option key={prio} value={prio}>
                    {prio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          {task && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: s }))}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                      formData.status === s
                        ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/10'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/20 transition-all"
            >
              <FiCheck className="w-4 h-4" />
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskModal;
