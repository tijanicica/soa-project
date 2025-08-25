// stakeholdersApi.js

import axios from 'axios';

const API_URL = 'http://localhost:8000/stakeholders';

const apiClient = axios.create({
  baseURL: API_URL,
});


apiClient.interceptors.request.use(
(config) => {
const token = localStorage.getItem('jwtToken'); // Čita ispravan ključ
if (token) {
// Ispravno - ovo je "template literal" string
config.headers['Authorization'] = `Bearer ${token}`;
}
return config;
},
(error) => {
return Promise.reject(error);
}
);



export const loginUser = async (credentials) => {
  const response = await apiClient.post('/login', credentials);
  return response.data;
};


export const registerUser = async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
};


export const getAllUsers = async () => {
const response = await apiClient.get('/api/users');
return response.data;
};


export const blockUser = async (userId) => {
    const response = await apiClient.put(`/api/users/${userId}/block`);
    return response.data;
};


export const getUserProfile = () => {
  return apiClient.get('/profile');
};

export const updateUserProfile = (profileData) => {
  return apiClient.put('/profile', profileData);
};


export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append('profileImage', file);

  return apiClient.post('/profile/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

