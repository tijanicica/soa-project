import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth.token) {
    // Ako korisnik nije ulogovan, vrati ga na login, ali zapamti gde je hteo da ide
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ako ruta zahteva specifičnu ulogu, a korisnik je nema, vrati ga na "zabranjeno"
  // ili na njegovu početnu stranicu.
  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    // U pravoj aplikaciji, ovo bi bila "403 Forbidden" stranica
    return <Navigate to="/" replace />;
  }

  // Ako je sve u redu, prikaži komponentu koju ruta zahteva
  return <Outlet />;
};

export default ProtectedRoute;