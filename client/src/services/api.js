import axios from 'axios';

// --- PRODUCTION API CLIENT ---
// We use '/api' as default to leverage Vercel rewrites in production
// Normalize API_BASE to ensure it always includes the /api segment if remote,
// and always ends with a single slash for consistent relative path joining.
const rawBase = import.meta.env.VITE_API_URL || '/api';
let normalizedBase = rawBase;

// If it's a full remote URL and doesn't end with /api, append it
if (normalizedBase.startsWith('http') && !normalizedBase.match(/\/api\/?$/)) {
  normalizedBase = normalizedBase.replace(/\/+$/, '') + '/api';
}

export const API_BASE = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`;

console.info(`[SYSTEM_DIAGNOSTIC]: API_BASE resolved to -> "${API_BASE}"`);

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// REQUEST INTERCEPTOR: Global Token Injection & Logging
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.debug(`[API_REQUEST]: ${config.method.toUpperCase()} ${fullUrl}`);
    
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
      window.location.href = '/';
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
  const res = await apiClient.post('auth/login', { username, password });
  return res.data;
};

export const register = async (userData) => {
  const res = await apiClient.post('auth/register', userData);
  return res.data;
};



export const fetchIncidents = async () => {
    const res = await apiClient.get('incidents');
    return res.data;
};



export const reportIncident = async (description, location) => {
    const res = await apiClient.post('incidents', { description, location });
    return res.data;
};



export const fetchGovActions = async () => {
    const res = await apiClient.get('incidents/actions');
    return res.data;
};



export const fetchMessages = async () => {
    const res = await apiClient.get('messages');
    return res.data;
};



export const sendMessage = async (content) => {
    const res = await apiClient.post('messages', { content });
    return res.data;
};



export const fetchAlerts = async () => {
    const res = await apiClient.get('alerts');
    return res.data;
};



export const createAlert = async (title, message, severity) => {
    const res = await apiClient.post('alerts', { title, message, severity });
    return res.data;
};

export const deleteIncident = async (id) => {
    const res = await apiClient.delete(`incidents/${id}`);
    return res.data;
};

export const deleteAccount = async () => {
    const res = await apiClient.delete('auth/account');
    return res.data;
};

export const fetchUsers = async () => {
    const res = await apiClient.get('users');
    return res.data;
};

export const commitIncidentAction = async (id, actionStatus, actionDetail) => {
    const res = await apiClient.post(`incidents/${id}/action`, {
        action_status: actionStatus,
        action_detail: actionDetail
    });
    return res.data;
};

export const deleteMessage = async (id) => {
    const res = await apiClient.delete(`messages/${id}`);
    return res.data;
};

// --- NEW PROTOCOLS ---

export const triggerSOS = async (location) => {
    const res = await apiClient.post('incidents/sos', { location });
    return res.data;
};

export const fetchResources = async () => {
    const res = await apiClient.get('resources');
    return res.data;
};

export const createResource = async (resourceData) => {
    const res = await apiClient.post('resources', resourceData);
    return res.data;
};

export const fetchVolunteerRequests = async () => {
    const res = await apiClient.get('volunteers/requests');
    return res.data;
};

export const createVolunteerRequest = async (requestData) => {
    const res = await apiClient.post('volunteers/request', requestData);
    return res.data;
};

export const acceptVolunteerRequest = async (id) => {
    const res = await apiClient.post(`volunteers/accept/${id}`);
    return res.data;
};

export const getAiGuidance = async (incidentType, description) => {
    const res = await apiClient.post('ai/guidance', { incident_type: incidentType, description });
    return res.data;
};

export default apiClient;
