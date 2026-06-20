import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-dark-950/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 p-6">
        
        {/* Warning Icon & Content */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shrink-0">
            <FiAlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4.5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4.5 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 transition-colors"
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
