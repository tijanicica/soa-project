// stakeholdersApi.js

import axios from 'axios';

const API_URL = 'http://localhost:8000/stakeholders';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor (presretač) koji će se izvršiti PRE SVAKOG zahteva
apiClient.interceptors.request.use(
  (config) => {
    // Pročitaj token iz localStorage
    const token = localStorage.getItem('jwtToken'); // ISPRAVLJEN KLJUČ
    
    // Ako token postoji, dodaj ga u Authorization zaglavlje
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

