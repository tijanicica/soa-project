import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart, checkout,removeItemFromCart } from "../services/TourApi";
import toast from "react-hot-toast"; // Ipak ću koristiti toast ovde jer je idealan za globalni kontekst

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Funkcija za ponovno dohvatanje podataka o korpi
  const refetchCart = useCallback(async () => {
    // Proveravamo token pre poziva
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        setCart(null); // Ako nema tokena, korpa je prazna
        return;
    }

    setIsLoading(true);
    try {
      const data = await getCart();
      setCart(data);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      // Ne prikazujemo grešku ako korisnik nije ulogovan
      if (error.response?.status !== 401) {
          toast.error("Could not load cart.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dohvati korpu kada se komponenta prvi put učita
  useEffect(() => {
    refetchCart();
  }, [refetchCart]);


  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      await checkout();
      toast.success("Purchase successful!");
      await refetchCart(); // Osveži korpu (biće prazna)
      return true; // Vrati uspeh
    } catch (error) {
      toast.error("Checkout failed.");
      console.error(error);
      return false; // Vrati neuspeh
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRemoveItem = async (tourId) => {
    try {
      await removeItemFromCart(tourId);
      toast.success("Item removed from cart.");
      await refetchCart(); // KLJUČNO: Osveži korpu da se prikažu promene
    } catch (error) {
      toast.error("Could not remove item.");
      console.error("Remove item error:", error);
    }
  };

  const value = {
    isCartOpen,
    openCart,
    closeCart,
    cart,
    isLoading,
    refetchCart,
    handleRemoveItem,
    handleCheckout,
    isCheckingOut
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};