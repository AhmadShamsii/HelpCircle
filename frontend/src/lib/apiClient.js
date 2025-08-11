import axios from 'axios';

export const getApiBase = () => {
  const env = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : process.env.BACKEND_URL;
  const base = env || 'http://localhost:5000';
  return base.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: getApiBase(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

export default api;
