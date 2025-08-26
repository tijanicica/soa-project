import axios from 'axios';

const API_URL = 'http://localhost:8000/blogs'; // Osnovna putanja za blogove

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAllBlogs = () => apiClient.get('/blogs');

export const createBlog = (formData) => {
  return apiClient.post('/blogs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const toggleLike = (blogId) => apiClient.post(`/blogs/${blogId}/like`);

export const addComment = (blogId, text) => apiClient.post(`/blogs/${blogId}/comments`, { text });
export const getCommentsForBlog = (blogId) => apiClient.get(`/blogs/${blogId}/comments`);

export const updateBlog = (blogId, formData) => {
  return apiClient.put(`/blogs/${blogId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};