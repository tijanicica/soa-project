import axios from 'axios';

const API_URL = 'http://localhost:8000/blogs'; // Osnovna putanja za blogove

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Primer funkcije koju ćeš kasnije dodati
// export const createBlog = (blogData) => apiClient.post('/blogs', blogData);