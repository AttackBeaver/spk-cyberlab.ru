import axios from 'axios';

console.log('✅ API module loaded');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('🔵 Axios request:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    fullURL: config.baseURL + (config.url || ''),
    headers: config.headers,
    data: config.data,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('🟢 Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🔴 Axios error:', error.response?.status, error.response?.config?.url, error.message);
    return Promise.reject(error);
  }
);

export default api;