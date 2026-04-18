import axios from 'axios';

// --- PRODUCTION API CLIENT ---
const API = import.meta.env.VITE_API_URL;
const apiClient = axios.create({
  baseURL: API || 'http://localhost:5000',
  timeout: 15000, // 15s absolute timeout for all requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// REQUEST INTERCEPTOR: Global Token Injection
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API_REQUEST_ERROR]:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Global Error Boundaries
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // 401: UNAUTHORIZED / SESSION EXPIRED
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('[SESSION_EXPIRED]: Redirecting to login protocol...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // 500: SERVER ERROR HUD
    if (error.response?.status >= 500) {
      console.error('[CRITICAL_SYSTEM_FAILURE]: Backend is unstable or overloading.');
    }

    // 403: FORBIDDEN
    if (error.response?.status === 403) {
      console.error('[ACCESS_DENIED]: Missing security clearance.');
    }

    return Promise.reject(error);
  }
);

// --- EXPORTED SERVICE WRAPPERS (Abstraction Layer) ---

export const login = async (username, password) => {
  const res = await apiClient.post('/api/auth/login', { username, password });
  return res.data;
};

export const register = async (userData) => {
  const res = await apiClient.post('/api/auth/register', userData);
  return res.data;
};

export const fetchIncidents = async () => {
    const res = await apiClient.get('/api/incidents');
    return res.data;
};

export const reportIncident = async (description, location) => {
    const res = await apiClient.post('/api/incidents', { description, location });
    return res.data;
};

export const fetchGovActions = async () => {
    const res = await apiClient.get('/api/incidents/actions');
    return res.data;
};

export const fetchMessages = async () => {
    const res = await apiClient.get('/api/messages');
    return res.data;
};

export const sendMessage = async (content) => {
    const res = await apiClient.post('/api/messages', { content });
    return res.data;
};

export const fetchAlerts = async () => {
    const res = await apiClient.get('/api/alerts');
    return res.data;
};

export const createAlert = async (title, message, severity) => {
    const res = await apiClient.post('/api/alerts', { title, message, severity });
    return res.data;
};

export const classifyText = async (text) => {
    const res = await apiClient.post('/classify', { text });
    return res.data;
};

export default apiClient;
