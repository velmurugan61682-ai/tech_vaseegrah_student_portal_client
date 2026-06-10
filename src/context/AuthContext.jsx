import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import * as authService from '../services/authService';
import * as studentService from '../services/studentService';
import { apiCall } from '../api/axiosInstance';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  // Toast notifications state
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Auto clear toast after 4 seconds
    setTimeout(() => {
      setToast(prev => {
        if (prev && prev.message === message) return null;
        return prev;
      });
    }, 4500);
  };

  const saveToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const logoutLocal = () => {
    saveToken(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const checkAuthStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        logoutLocal();
      }
    } catch (err) {
      console.error('Session verify failed:', err);
      logoutLocal();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [token]);

  // Handle unauthorized responses globally
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Session expired event received. Logging out...');
      logoutLocal();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [socket]);

  // Socket connection side-effect
  useEffect(() => {
    if (user) {
      console.log(`🔌 Initializing socket client connection to: ${API_BASE_URL}`);
      const newSocket = io(API_BASE_URL, {
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      // Join a socket room corresponding to the user's ID
      newSocket.emit('join', user.id || user._id);

      // Sockets listeners for student triggers
      newSocket.on('task_assigned', (data) => {
        showToast(`📋 New Task Assigned: "${data.title}"`, 'info');
      });

      newSocket.on('task_reviewed', (data) => {
        const isApproved = data.status === 'Approved';
        showToast(
          `🔔 Task "${data.title}" reviewed as: ${data.status}. ${isApproved ? 'Great job!' : 'Please check feedback.'}`,
          isApproved ? 'success' : 'danger'
        );
      });

      newSocket.on('attendance_updated', (data) => {
        showToast(`📅 Attendance updated to "${data.status}" for date: ${data.date}`, 'warning');
      });

      // Sockets listeners for admin triggers
      newSocket.on('task_submitted', (data) => {
        if (user.role === 'admin') {
          showToast(`🚀 Solution submitted by ${data.studentName} for: "${data.title}"`, 'info');
        }
      });

      newSocket.on('student_registered', (data) => {
        if (user.role === 'admin') {
          showToast(`👤 New Student Joined: ${data.name} (${data.course})`, 'success');
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const login = async (email, password, role) => {
    try {
      let data;
      if (role === 'admin') {
        data = await authService.loginAdmin(email, password);
      } else {
        data = await authService.loginStudent(email, password);
      }

      if (data.success && data.token) {
        saveToken(data.token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      return { success: false, message: msg };
    }
  };

  const register = async (userData, role) => {
    try {
      let data;
      if (role === 'admin') {
        data = await authService.registerAdmin(userData);
      } else {
        data = await authService.registerStudent(userData);
      }

      if (data.success && data.token) {
        saveToken(data.token);
        setUser(data.user);
        showToast('Registration completed successfully!', 'success');
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await authService.logoutUser();
    } catch (err) {
      console.error(err);
    } finally {
      logoutLocal();
    }
  };

  const updateProfile = async (id, userData) => {
    try {
      const data = await studentService.updateStudentProfile(userData);
      if (data.success) {
        setUser(data.student);
        showToast('Profile settings saved successfully!', 'success');
        return { success: true, user: data.student };
      } else {
        return { success: false, message: data.message || 'Profile update failed' };
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      return { success: false, message: msg };
    }
  };

  // Toast theme mapping styles
  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return { background: 'rgba(16, 185, 129, 0.9)', borderLeft: '5px solid #047857', color: '#fff' };
      case 'danger':
        return { background: 'rgba(239, 68, 68, 0.9)', borderLeft: '5px solid #b91c1c', color: '#fff' };
      case 'warning':
        return { background: 'rgba(245, 158, 11, 0.9)', borderLeft: '5px solid #d97706', color: '#fff' };
      case 'info':
      default:
        return { background: 'rgba(99, 102, 241, 0.9)', borderLeft: '5px solid #4f46e5', color: '#fff' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        showToast,
        socket,
        apiCall
      }}
    >
      {children}

      {/* Floating Toast Notification Popup */}
      {toast && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 10000,
            padding: '16px 24px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), var(--shadow-glow)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-heading)',
            fontWeight: '600',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            maxWidth: '380px',
            ...getToastStyles(toast.type)
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {toast.type === 'success' && <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />}
            {toast.type === 'danger' && (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
            {toast.type === 'warning' && (
              <>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </>
            )}
            {toast.type === 'info' && (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </>
            )}
          </svg>
          <div>{toast.message}</div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
