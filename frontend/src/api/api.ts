import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the Bearer token
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
  }
  return config;
});

export default API;
