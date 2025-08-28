// frontend/src/App.jsx (FINALNA, ISPRAVLJENA VERZIJA)

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContextProvider";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { GuidePage } from "./pages/GuidePage";
import { TouristProfilePage } from "./pages/TouristProfilePage";
import { GuideProfilePage } from "./pages/GuideProfilePage";
import { BlogPage } from "./pages/BlogPage";
import { CreateTourPage } from "./pages/CreateTourPage";
import { EditTourPage } from "./pages/EditTourPage";
import { MyToursPage } from "./pages/MyToursPage";
import { PositionSimulatorPage } from "./pages/PositionSimulatorPage";
import { CommunityPage } from "./pages/CommunityPage";
import { FollowingPage } from "./pages/FollowingPage";


import { MyPurchasedToursPage } from "./pages/MyPurchasedToursPage"; 
import { CartProvider, useCart } from "./contex/CartContex"; 
import { ShoppingCartSheet } from "./components/ShoppingCartSheet";
// Pomoćna komponenta za preusmeravanje ulogovanih korisnika sa "/" putanje
function RedirectIfLoggedIn() {
  const { auth } = useAuth();
  if (!auth.user) return <LoginPage />; // Ako nema korisnika, pošalji ga na login

  // Ako ima korisnika, pošalji ga na njegovu početnu stranicu
  switch (auth.user.role) {
    case "administrator":
      return <Navigate to="/admin" />;
    case "guide":
      return <Navigate to="/guide" />;
    case "tourist":
      return <Navigate to="/home" />;
    default:
      return <LoginPage />;
  }
}

function AppContent() {
  const { auth } = useAuth();
   const { isCartOpen, closeCart } = useCart();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <Routes>
      {/* Login i Register su sada uvek dostupne rute */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Zaštićene rute za uloge */}
      <Route element={<ProtectedRoute allowedRoles={["administrator"]} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["guide"]} />}>
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/guide/profile" element={<GuideProfilePage />} />
        <Route path="/guide/tours/new" element={<CreateTourPage />} />
        <Route path="/guide/tours/edit/:tourId" element={<EditTourPage />} />
        <Route path="/guide/my-tours" element={<MyToursPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["tourist"]} />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/blogs" element={<BlogPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/network" element={<FollowingPage />} />
        <Route path="/tourist/profile" element={<TouristProfilePage />} />
        <Route path="/simulator" element={<PositionSimulatorPage />} />
         <Route path="/my-tours" element={<MyPurchasedToursPage />} />
      </Route>

      {/* Glavna ruta "/" preusmerava na osnovu uloge ili na login */}
      <Route path="/" element={<RedirectIfLoggedIn />} />

      {/* Hvatanje svih nepostojećih ruta */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>

     <ShoppingCartSheet
        isOpen={isCartOpen}       // Vidljivost se kontroliše globalnim stanjem
        onOpenChange={closeCart}   // Zatvaranje poziva globalnu funkciju
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
         <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
