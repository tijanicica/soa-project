import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { getCart, addToCart, removeFromCart, checkout } from '../services/PurchaseApi';
import { useAuth } from '../hooks/useAuth';

// 1. Kreiramo Context
const CartContext = createContext();

// 2. Akcije koje možemo izvršiti nad stanjem
const ACTIONS = {
  SET_CART: 'set-cart',
  SET_LOADING: 'set-loading',
  SET_ERROR: 'set-error',
};

// 3. Reducer - funkcija koja upravlja promenama stanja (ostaje ista)
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CART:
      return { ...state, cart: action.payload, loading: false, error: null };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: true };
    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

// 4. Provider Komponenta - "mozak" operacije
export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    cart: { items: [], totalPrice: 0 },
    loading: true,
    error: null,
  });

  // Funkcija za dohvatanje korpe sa servera (ostaje ista)
  const fetchCart = async () => {
    dispatch({ type: ACTIONS.SET_LOADING });
    try {
      const response = await getCart();
      dispatch({ type: ACTIONS.SET_CART, payload: response.data });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Could not fetch cart.' });
    }
  };

  // useEffect za učitavanje korpe (ostaje isti)
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      dispatch({ type: ACTIONS.SET_CART, payload: { items: [], totalPrice: 0 } });
    }
  }, [isAuthenticated]);

  // --- POČETAK ISPRAVKE ---

  // Funkcije koje će komponente koristiti za interakciju
  const addItemToCart = async (tourId) => {
    try {
      // API poziv vraća ceo ShoppingCart objekat, a ne formatirani { items, totalPrice }
      const response = await addToCart(tourId); 
      
      // Ručno formatiramo odgovor da odgovara onome što očekujemo
      const updatedCartData = response.data;
      const formattedCart = {
          items: updatedCartData.items,
          totalPrice: updatedCartData.items.reduce((sum, item) => sum + item.price, 0)
      };
      
      // Ažuriramo stanje sa ispravno formatiranim podacima
      dispatch({ type: ACTIONS.SET_CART, payload: formattedCart });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  const removeItemFromCart = async (tourId) => {
     try {
      // Ista logika kao za dodavanje
      const response = await removeFromCart(tourId);
      const updatedCartData = response.data;
      const formattedCart = {
          items: updatedCartData.items,
          totalPrice: updatedCartData.items.reduce((sum, item) => sum + item.price, 0)
      };
      dispatch({ type: ACTIONS.SET_CART, payload: formattedCart });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  const checkoutCart = async () => {
    try {
      await checkout();
      // Nakon checkout-a, korpa je prazna, pa samo ponovo dohvatimo stanje
      await fetchCart(); 
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  // --- KRAJ ISPRAVKE ---


  // Vrednosti koje pružamo celoj aplikaciji (ostaje isto)
  const value = {
    cart: state.cart,
    cartItemCount: state.cart?.items?.length || 0,
    loading: state.loading,
    error: state.error,
    addItemToCart,
    removeItemFromCart,
    checkoutCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 5. Custom Hook - olakšava korišćenje konteksta (ostaje isti)
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}