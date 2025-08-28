// U fajlu: src/services/PurchaseApi.js (FINALNA, ISPRAVLJENA VERZIJA)

import axios from 'axios';

// 1. Glavni URL za purchase servis
const API_URL = 'http://localhost:8000/purchase';

// 2. Kreiranje nove instance Axios-a sa osnovnom konfiguracijom
const apiClient = axios.create({
  baseURL: API_URL,
});

// 3. Presretač (interceptor) koji dodaje JWT token u header svakog zahteva
// Ovo je najvažniji deo - osigurava da su svi pozivi autorizovani
apiClient.interceptors.request.use(
  (config) => {
    // Čita token iz Local Storage-a
    const token = localStorage.getItem('jwtToken'); 
    if (token) {
      // Dodaje 'Authorization: Bearer <token>' header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // U slučaju greške pri postavljanju, odbaci promise
    return Promise.reject(error);
  }
);

/*
 * Definicije za svaki API endpoint.
 * Svaka funkcija koristi 'apiClient' koji automatski dodaje token.
 * Koristimo 'response.data' da bismo komponentama odmah vratili koristan JSON objekat.
*/

// GET /cart - Dohvata trenutno stanje korpe za ulogovanog korisnika
export const getCart = async () => {
    const response = await apiClient.get('/cart');
    return response.data;
};

// POST /cart/add - Dodaje turu u korpu
export const addToCart = async (tourId) => {
    const response = await apiClient.post('/cart/add', { tourId });
    return response.data;
};

// DELETE /cart/item/{tourId} - Uklanja turu iz korpe
export const removeFromCart = async (tourId) => {
    const response = await apiClient.delete(`/cart/item/${tourId}`);
    return response.data;
};

// POST /cart/checkout - Pokreće proces kupovine
export const checkout = async () => {
    const response = await apiClient.post('/cart/checkout');
    return response.data;
};

// GET /my-tokens - Dohvata sve kupljene ture (tokene) za korisnika
export const getMyPurchaseTokens = async () => {
    const response = await apiClient.get('/my-tokens');
    return response.data;
};

// GET /tokens/check/{tourId} - Proverava da li je korisnik već kupio određenu turu
export const checkTourOwnership = async (tourId) => {
    const response = await apiClient.get(`/tokens/check/${tourId}`);
    return response.data;
};