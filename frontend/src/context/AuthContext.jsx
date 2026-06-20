import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate user profile on load or token update
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.success ? res.data : res.data.user); // handle variations
        } catch (error) {
          console.error('Profile fetch failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  // Register User
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        const { token: userToken, ...userData } = res.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors,
      };
    }
  };

  // Login User
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: userToken, ...userData } = res.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  // Update Profile
  const updateProfile = async (name, email) => {
    try {
      const res = await api.put('/auth/profile', { name, email });
      if (res.data.success) {
        const { token: userToken, ...userData } = res.data;
        // Update user state and storage
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed',
        errors: error.response?.data?.errors,
      };
    }
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      return { success: res.data.success, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password update failed',
      };
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgotpassword', { email });
      return { success: res.data.success, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Forgot password request failed',
      };
    }
  };

  // Reset Password
  const resetPassword = async (resetToken, password) => {
    try {
      const res = await api.put(`/auth/resetpassword/${resetToken}`, { password });
      return { success: res.data.success, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
