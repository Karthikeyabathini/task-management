import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiArrowLeft, FiCheckSquare } from 'react-icons/fi';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const res = await forgotPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      toast.success('Reset link sent to your email!');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-slate-100 via-teal-50/20 to-slate-200 dark:from-dark-950 dark:via-teal-950/10 dark:to-dark-900 transition-colors duration-300">
      <div className="w-full max-w-md bg-white/70 dark:bg-dark-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo Banner */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/25 mb-3">
            <FiCheckSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-850 dark:text-white">Reset Password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center">
            {submitted 
              ? "We've sent a link to recover your account." 
              : "Enter your email and we'll send you a password reset link."}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-teal-500/10 text-teal-650 dark:text-teal-400 text-sm">
              An email has been sent to <strong>{email}</strong>. Check your inbox and follow the instructions to set a new password. (If running in simulation mode, check your server console log!)
            </div>
            
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline focus:outline-none"
            >
              <FiArrowLeft /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <FiMail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${
                    error
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                  } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
                />
              </div>
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back Link */}
            <div className="text-center mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiArrowLeft /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
