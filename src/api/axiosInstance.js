import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const cleanBaseURL = API_BASE_URL.replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: `${cleanBaseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (unauthorized errors)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config && error.config.url && (
        error.config.url.includes('/auth/admin/login') ||
        error.config.url.includes('/auth/student/login')
      );
      if (!isLoginRequest) {
        console.log('Session expired. Logging out.');
        localStorage.removeItem('token');
        // Dispatch custom event to notify AuthContext to log out React state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-unauthorized'));
        }
      }
    }
    return Promise.reject(error);
  }
);

// Fetch-compatible wrapper over axios for compatibility with legacy components
export const apiCall = async (url, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method: method.toLowerCase(),
    url,
    headers: { ...headers },
  };

  if (body) {
    if (body instanceof FormData) {
      config.data = body;
      // Do not set content-type header; browser/axios handles boundary Automatically
      delete config.headers['Content-Type'];
    } else {
      try {
        config.data = typeof body === 'string' ? JSON.parse(body) : body;
      } catch (e) {
        config.data = body;
      }
    }
  }

  try {
    const response = await axiosInstance(config);
    return {
      ok: true,
      status: response.status,
      json: async () => response.data,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    console.error(`apiCall error on ${url}:`, error);
    const status = error.response ? error.response.status : 500;
    const data = error.response ? error.response.data : { success: false, message: error.message };
    return {
      ok: false,
      status,
      json: async () => data,
      data,
      headers: error.response ? error.response.headers : {}
    };
  }
};

export default axiosInstance;
