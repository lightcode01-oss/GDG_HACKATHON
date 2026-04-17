import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password });
  return res.data;
};

export const register = async (userData) => {
  const res = await api.post('/api/auth/register', userData);
  return res.data;
};

export const fetchIncidents = async () => {
  const res = await api.get('/api/incidents');
  return res.data;
};

export const reportIncident = async (description, location) => {
  const res = await api.post('/api/incidents', { description, location });
  return res.data;
};

export const fetchGovActions = async () => {
  const res = await api.get('/api/incidents/actions');
  return res.data;
};

export const fetchMessages = async () => {
  const res = await api.get('/api/messages');
  return res.data;
};

export const sendMessage = async (content) => {
  const res = await api.post('/api/messages', { content });
  return res.data;
};

export const fetchAlerts = async () => {
  const res = await api.get('/api/alerts');
  return res.data;
};

export const createAlert = async (title, message, severity) => {
  const res = await api.post('/api/alerts', { title, message, severity });
  return res.data;
};
