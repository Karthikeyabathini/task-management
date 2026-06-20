import React from 'react';
import { FiBriefcase, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';

const DashboardCards = ({ stats }) => {
  const { total = 0, completed = 0, pending = 0, highPriority = 0 } = stats;
  
  // Calculate progress percentage
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cardItems = [
    {
      title: 'Total Tasks',
      value: total,
      icon: FiBriefcase,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      title: 'Completed',
      value: completed,
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      title: 'Pending Tasks',
      value: pending,
      icon: FiClock,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
      title: 'High Priority',
      value: highPriority,
      icon: FiAlertTriangle,
      color: 'from-rose-500 to-pink-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardItems.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
            >
              {/* Content */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">
                    {card.value}
                  </p>
                </div>
                
                {/* Icon wrapper */}
                <div className={`p-3 rounded-xl ${card.bgColor} ${card.textColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              
              {/* Bottom decorative bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.color}`} />
            </div>
          );
        })}
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Overall Task Completion</h3>
          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{progressPercent}%</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <p className="text-xs text-slate-500 mt-2">
          {total > 0
            ? `${completed} of ${total} tasks finished. Keep going!`
            : 'No tasks scheduled yet. Create one to begin your streak!'}
        </p>
      </div>
    </div>
  );
};

export default DashboardCards;
