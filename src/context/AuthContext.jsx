import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Store token helper
  const saveToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  // Base API call helper that handles authorization headers and token refreshes
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Inject headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // Always include credentials (cookies)
    config.credentials = 'include';

    try {
      let response = await fetch(url, config);

      // Handle token expiration / unauthorized error
      if (response.status === 401 && token) {
        // Attempt to refresh token
        console.log('Access token expired, attempting refresh...');
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newTokenValue = refreshData.token;
          saveToken(newTokenValue);

          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${newTokenValue}`;
          response = await fetch(url, { ...config, headers });
        } else {
          // Refresh failed, clear session
          console.warn('Session expired, logging out...');
          logoutLocal();
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('API call exception:', error);
      throw error;
    }
  };

  // Fetch current user details
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
      console.error(err);
      logoutLocal();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [token]);

  // Login action
  const login = async (email, password, role) => {
    const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/student/login';
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      saveToken(data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  };

  // Register action
  const register = async (userData, role) => {
    const endpoint = role === 'admin' ? '/auth/admin/register' : '/auth/student/register';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      saveToken(data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Registration failed' };
    }
  };

  // Logout actions
  const logoutLocal = () => {
    saveToken(null);
    setUser(null);
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

  const updateProfile = async (id, updatedData) => {
    try {
      const response = await apiCall(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.student);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Update failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
