import axios from 'axios';

// Osnovna putanja ka tour-service-u preko API Gateway-a
const API_URL = 'http://localhost:8000/tours';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor koji automatski dodaje JWT token u svaki zahtev.
// Ovo je ključno jer je kreiranje ture zaštićena ruta.
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


/**
 * Šalje podatke za kreiranje nove ture na backend.
 */
export const createTour = async (tourData) => {
  // Sada eksplicitno kažemo celu putanju
  const response = await apiClient.post('/create', tourData); 
  return response.data;
};

/**
 * Dohvata podatke o jednoj turi na osnovu njenog ID-ja.
 */
export const getTourById = async (tourId) => {
  const response = await apiClient.get(`/${tourId}`);
  return response.data;
};



export const updateTour = async (tourId, tourData) => {
  const response = await apiClient.put(`/${tourId}`, tourData);
  return response.data;
};

export const getMyTours = async () => {
  const response = await apiClient.get('/my-tours');
  return response.data;
};

export const addKeypointToTour = async (tourId, keypointData) => {
  const response = await apiClient.post(`/${tourId}/keypoints`, keypointData);
  return response.data;
};

export const updateKeypoint = async (tourId, keypointId, keypointData) => {
  const response = await apiClient.put(`/${tourId}/keypoints/${keypointId}`, keypointData);
  return response.data;
};


export const deleteKeypoint = async (tourId, keypointId) => {
  const response = await apiClient.delete(`/${tourId}/keypoints/${keypointId}`);
  return response.data;
};

export const uploadTourImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateTourDistance = async (tourId, distance) => {
  // Šaljemo objekat koji odgovara našem DistanceUpdateDto na backendu
  const response = await apiClient.put(`/${tourId}/distance`, { distance });
  return response.data;
};

export const updateTransportTimes = async (tourId, transportTimes) => {
  const response = await apiClient.put(`/${tourId}/transport-times`, transportTimes);
  return response.data;
};

export const publishTour = async (tourId) => {
  const response = await apiClient.patch(`/${tourId}/publish`);
  return response.data;
};

export const archiveTour = async (tourId) => {
  const response = await apiClient.patch(`/${tourId}/archive`);
  return response.data;
};

export const reactivateTour = async (tourId) => {
  const response = await apiClient.patch(`/${tourId}/reactivate`);
  return response.data;
};

