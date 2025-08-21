// stakeholdersApi.js

import axios from 'axios';

const API_URL = 'http://localhost:8000/stakeholders';

const apiClient = axios.create({
  baseURL: API_URL,
});

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