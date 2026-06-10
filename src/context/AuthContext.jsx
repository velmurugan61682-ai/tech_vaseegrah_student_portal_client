import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

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
  };

  const apiCall = async (endpoint, options = {}) => {
    let formattedEndpoint = endpoint;
    if (!endpoint.startsWith('/api') && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      formattedEndpoint = `/api${endpoint}`;
    }
    const url = `${API_BASE_URL}${formattedEndpoint}`;
    
    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      if (response.status === 401) {
        logoutLocal();
      }
      return response;
    } catch (error) {
      console.error('API call exception:', error);
      throw error;
    }
  };

  const checkAuthStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiCall('/auth/me');
      if (response.ok) {
        const data = await response.json();
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

  const login = async (email, password, role) => {
    try {
      const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/student/login';
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        saveToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (userData, role) => {
    try {
      const endpoint = role === 'admin' ? '/auth/admin/register' : '/auth/student/register';
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        saveToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      logoutLocal();
    }
  };

  const updateProfile = async (id, userData) => {
    try {
      const response = await apiCall('/student/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.student || data.data || data);
        return { success: true, user: data.student || data.data || data };
      } else {
        return { success: false, message: data.message || 'Profile update failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
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
        apiCall
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
