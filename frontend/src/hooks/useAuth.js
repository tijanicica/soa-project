import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Uvozimo objekat

// Ovaj fajl eksportuje SAMO hook.
export const useAuth = () => {
  return useContext(AuthContext);
};