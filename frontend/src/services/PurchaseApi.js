import axios from 'axios';

const API_URL = 'http://localhost:8000/purchase';

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
  (error) => {
    
    return Promise.reject(error);
  }
);

export const getCart = () => apiClient.get('/cart');


export const addToCart = (tourId) => apiClient.post('/cart/add', { tourId });


export const removeFromCart = (tourId) => apiClient.delete(`/cart/item/${tourId}`);


export const checkout = () => apiClient.post('/cart/checkout');


export const checkTourOwnership = (tourId) => apiClient.get(`/tokens/check/${tourId}`);

export const getMyPurchaseTokens = () => apiClient.get('/my-tokens');