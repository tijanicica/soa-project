import axios from 'axios';

// Novi, odvojeni API URL za Tour Executions
const API_URL = 'http://localhost:8000/tours/tour-executions';

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

// Pokreni turu (kreiraj sesiju)
export const startTour = async (tourId, startPosition) => {
  const response = await apiClient.post(`/${tourId}/start`, startPosition);
  return response.data;
};

// Dobavi stanje aktivne ture
export const getTourExecution = async (executionId) => {
  const response = await apiClient.get(`/${executionId}`);
  return response.data;
};

// Ažuriraj poziciju
export const updateTourPosition = async (executionId, newPosition) => {
  const response = await apiClient.put(`/${executionId}/update-position`, newPosition);
  return response.data;
};

// Napusti turu
export const abandonTour = async (executionId) => {
  const response = await apiClient.patch(`/${executionId}/abandon`);
  return response.data;
};