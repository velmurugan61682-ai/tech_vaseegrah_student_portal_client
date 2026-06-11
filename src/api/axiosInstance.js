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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle session expiration (unauthorized errors) and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Catches 404 errors and logs them cleanly
    if (error.response && error.response.status === 404) {
      console.warn(`[API 404] Resource not found: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
    }

    // Catches 401 errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const url = originalRequest?.url || '';
      // Check if this is a login or register request
      const isLoginOrRegister = url.toLowerCase().includes('login') || url.toLowerCase().includes('register');

      if (!isLoginOrRegister) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          // Attempt to refresh JWT token
          axiosInstance.post('/auth/refresh')
            .then(({ data }) => {
              if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
                processQueue(null, data.token);
                resolve(axiosInstance(originalRequest));
              } else {
                throw new Error('Token refresh failed');
              }
            })
            .catch((refreshError) => {
              processQueue(refreshError, null);
              console.log('Session expired. Logging out.');
              localStorage.removeItem('token');
              // Dispatch custom event to notify AuthContext to log out React state
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth-unauthorized'));
              }
              reject(refreshError);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
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
