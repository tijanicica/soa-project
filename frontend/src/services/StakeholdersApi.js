// stakeholdersApi.js

import axios from 'axios';

const API_URL = 'http://localhost:8000/stakeholders';

const apiClient = axios.create({
  baseURL: API_URL,
});

// --- KLJUČNI DEO: Axios Interceptor ---
// Presreće svaki odlazni zahtev i dodaje mu 'Authorization' zaglavlje
// ako token postoji u localStorage pod ključem 'jwtToken'.
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
  
  // --- DODAJTE OVAJ CONSOLE.LOG ---
  console.log("Podaci koji se šalju na API:", credentials);
  console.log("Tip podataka:", typeof credentials);
  // --------------------------------

  const response = await apiClient.post('/login', credentials);
  return response.data;
};


export const registerUser = async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
};

// --- NOVA FUNKCIJA ZA ADMINA ---
// Dohvata sve korisnike. Token se dodaje automatski pomoću interceptora.
export const getAllUsers = async () => {
const response = await apiClient.get('/api/users');
return response.data;
};

// Funkcija za blokiranje korisnika.
// Token se dodaje automatski pomoću interceptora.
export const blockUser = async (userId) => {
    const response = await apiClient.put(`/api/users/${userId}/block`);
    return response.data;
};