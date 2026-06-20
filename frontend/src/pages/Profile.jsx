import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile Details State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Tabs: 'details' or 'password'
  const [activeTab, setActiveTab] = useState('details');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Name is required';
    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tempErrors.email = 'Invalid email format';
    }

    if (Object.keys(tempErrors).length > 0) {
      setProfileErrors(tempErrors);
      return;
    }

    setIsUpdatingProfile(true);
    setProfileErrors({});
    const res = await updateProfile(name, email);
    setIsUpdatingProfile(false);

    if (res.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(res.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!currentPassword) tempErrors.currentPassword = 'Current password is required';
    if (!newPassword) {
      tempErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(tempErrors).length > 0) {
      setPasswordErrors(tempErrors);
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordErrors({});
    const res = await changePassword(currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Profile Summary */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 transition-all duration-300">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`}
          alt={user?.name}
          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-teal-500/20"
        />
        <div className="text-center sm:text-left space-y-1 flex-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{user?.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          <div className="flex justify-center sm:justify-start gap-2 mt-1.5">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400">
              Active Member
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'details'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'password'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Security & Password
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300">
        {activeTab === 'details' ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
            <h2 className="text-md font-bold text-slate-850 dark:text-white mb-4">Edit Public Profile</h2>
            
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <FiUser className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (profileErrors.name) setProfileErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border ${
                    profileErrors.name
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                  } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
                />
              </div>
              {profileErrors.name && <p className="text-xs text-rose-500 mt-1">{profileErrors.name}</p>}
            </div>

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
                    if (profileErrors.email) setProfileErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border ${
                    profileErrors.email
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                  } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
                />
              </div>
              {profileErrors.email && <p className="text-xs text-rose-500 mt-1">{profileErrors.email}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 transition-all focus:outline-none disabled:opacity-50"
            >
              {isUpdatingProfile ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4" /> Save Information
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <h2 className="text-md font-bold text-slate-850 dark:text-white mb-4">Change Security Password</h2>
            
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                  }}
                  className={`w-full pl-11 pr-11 py-2.5 rounded-xl border ${
                    passwordErrors.currentPassword
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                  } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-650 dark:text-slate-500 focus:outline-none"
                >
                  {showCurrent ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.currentPassword && <p className="text-xs text-rose-500 mt-1">{passwordErrors.currentPassword}</p>}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                  }}
                  className={`w-full pl-11 pr-11 py-2.5 rounded-xl border ${
                    passwordErrors.newPassword
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                  } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-650 dark:text-slate-500 focus:outline-none"
                >
                  {showNew ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.newPassword && <p className="text-xs text-rose-500 mt-1">{passwordErrors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  className={`w-full pl-11 pr-11 py-2.5 rounded-xl border ${
                    passwordErrors.confirmPassword
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                  } bg-transparent dark:text-white focus:outline-none focus:ring-4 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-650 dark:text-slate-500 focus:outline-none"
                >
                  {showConfirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{passwordErrors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 transition-all focus:outline-none disabled:opacity-50"
            >
              {isUpdatingPassword ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4" /> Save Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
      
    </div>
  );
};

export default Profile;
