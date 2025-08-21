import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from './AuthContext'; // Uvozimo objekat
import { loginUser } from '../services/StakeholdersApi';

// Ovaj fajl eksportuje SAMO Provider komponentu.
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null, isLoading: true });

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setAuth({ token, user: { id: decoded.sub, role: decoded.role }, isLoading: false });
        } else {
          localStorage.removeItem('jwtToken');
          setAuth({ token: null, user: null, isLoading: false });
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('jwtToken');
        setAuth({ token: null, user: null, isLoading: false });
      }
    } else {
      setAuth({ token: null, user: null, isLoading: false });
    }
  }, []);


  const login = async (username, password) => {
  // Ključna linija: username i password se pakuju u objekat
  // i taj JEDAN objekat se prosleđuje funkciji loginUser.
  const response = await loginUser({ username, password });
  
  const { token } = response;
  const decoded = jwtDecode(token);
  
  localStorage.setItem('jwtToken', token);
  setAuth({ token, user: { id: decoded.sub, role: decoded.role }, isLoading: false });
  return decoded.role;
};

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setAuth({ token: null, user: null, isLoading: false });
  };
  
  const value = { auth, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!auth.isLoading && children}
    </AuthContext.Provider>
  );
};