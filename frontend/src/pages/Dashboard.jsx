import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import DashboardCards from '../components/DashboardCards';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { FiPlus, FiArrowRight, FiCheckSquare, FiActivity, FiClock, FiAlertCircle } from 'react-icons/fi';

// Chart JS imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all tasks for analytics
  const fetchTasks = async () => {
    try {
      // Fetch up to 1000 tasks for dashboard computations
      const res = await api.get('/tasks?limit=1000');
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching dashboard tasks:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Listen for real-time task updates
  useEffect(() => {
    if (socket) {
      const handleTaskUpdate = (data) => {
        const { action, task } = data;
        
        setTasks((prevTasks) => {
          let updated = [...prevTasks];
          
          if (action === 'create') {
            updated = [task, ...updated];
          } else if (action === 'update' || action === 'status_change') {
            updated = updated.map((t) => (t._id === task._id ? task : t));
          } else if (action === 'delete') {
            updated = updated.filter((t) => t._id !== task._id);
          }
          
          return updated;
        });

        // Trigger toast alerts for background activity
        if (action === 'create') {
          toast.info(`Task created: "${task.title}"`);
        } else if (action === 'status_change') {
          toast.info(`Task status updated: "${task.title}" (${task.status})`);
        }
      };

      socket.on('task_update', handleTaskUpdate);

      return () => {
        socket.off('task_update', handleTaskUpdate);
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Analytics calculations
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const pending = tasks.filter((t) => t.status === 'Pending').length;
  const highPriority = tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length;

  const lowPriorityCount = tasks.filter((t) => t.priority === 'Low').length;
  const mediumPriorityCount = tasks.filter((t) => t.priority === 'Medium').length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'High').length;

  // Sorting for recent activity: 5 most recently updated tasks
  const recentActivities = [...tasks]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  // Doughnut Chart Data: Task Statuses
  const statusChartData = {
    labels: ['Pending', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [pending, inProgress, completed],
        backgroundColor: [
          'rgba(245, 158, 11, 0.85)', // Amber
          'rgba(59, 130, 246, 0.85)',  // Blue
          'rgba(16, 185, 129, 0.85)',  // Emerald
        ],
        borderColor: [
          '#f59e0b',
          '#3b82f6',
          '#10b981',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Bar Chart Data: Task Priorities
  const priorityChartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        label: 'Task Count',
        data: [lowPriorityCount, mediumPriorityCount, highPriorityCount],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)', // Sky Blue
          'rgba(245, 158, 11, 0.8)', // Amber
          'rgba(239, 68, 68, 0.8)',  // Rose
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'currentColor', // Fits dark/light theme
          font: { family: 'Inter', size: 12 },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-500/10">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl -mb-8" />
        
        <div className="relative z-10 space-y-2.5 max-w-lg">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hi, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-teal-50 text-sm sm:text-base leading-relaxed">
            Welcome back to TaskFlow. You have <strong className="underline decoration-wavy decoration-emerald-250 underline-offset-4">{pending + inProgress}</strong> active tasks awaiting action. Let's make today productive!
          </p>
          <div className="pt-2">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-700 font-semibold text-xs shadow-md hover:bg-slate-50 transition-all hover:scale-105"
            >
              <FiPlus className="w-4 h-4" /> Add Task
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardCards stats={{ total, completed, pending: pending + inProgress, highPriority }} />

      {/* Analytics Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Distribution */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-teal-500" /> Task Status Distribution
          </h2>
          <div className="h-56 relative flex items-center justify-center">
            {total > 0 ? (
              <Doughnut data={statusChartData} options={chartOptions} />
            ) : (
              <div className="text-xs text-slate-450 dark:text-slate-500 text-center">No status data to present</div>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-teal-500" /> Priority Distributions
          </h2>
          <div className="h-56 relative flex items-center justify-center">
            {total > 0 ? (
              <Bar
                data={priorityChartData}
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      ticks: { stepSize: 1, color: 'currentColor' },
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    },
                    x: {
                      ticks: { color: 'currentColor' },
                      grid: { display: false },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-xs text-slate-450 dark:text-slate-500 text-center">No priority data to present</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <FiClock className="w-4 h-4 text-teal-500" /> Recent Activities
            </h2>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((task) => (
                  <div key={task._id} className="flex items-center gap-3">
                    {/* Status Dot */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500'
                          : task.status === 'In Progress'
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Updated {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 capitalize">
                      {task.category}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-450 dark:text-slate-500 text-center py-6">No recent task activity</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Link
              to="/tasks"
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
            >
              Manage Tasks <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
