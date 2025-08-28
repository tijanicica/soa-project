// U fajlu: src/contex/CartContex.jsx (Verzija bez provere autorizacije)

import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { getCart, addToCart, removeFromCart, checkout } from '../services/PurchaseApi';
// OBRISANO: Ne uvozimo više useAuth

// 1. Kreiramo Context
const CartContext = createContext();

// 2. Akcije koje možemo izvršiti nad stanjem
const ACTIONS = {
  SET_CART: 'set-cart',
  SET_LOADING: 'set-loading',
  SET_ERROR: 'set-error',
  OPEN_CART: 'open-cart',
  CLOSE_CART: 'close-cart',
};

// 3. Reducer - ostaje potpuno isti
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CART:
      return { ...state, cart: action.payload, loading: false, error: null };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: true };
    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.payload };
    case ACTIONS.OPEN_CART:
      return { ...state, isCartOpen: true };
    case ACTIONS.CLOSE_CART:
      return { ...state, isCartOpen: false };
    default:
      return state;
  }
}

// 4. Provider Komponenta - "mozak" operacije (sada mnogo jednostavniji)
export function CartProvider({ children }) {
  // OBRISANO: Ne zovemo useAuth()
  
  const [state, dispatch] = useReducer(cartReducer, {
    cart: { Items: [], TotalPrice: 0 },
    loading: true, // Uvek počinjemo sa stanjem učitavanja
    error: null,
    isCartOpen: false,
  });

  // --- Funkcije za upravljanje podacima korpe ---

  const fetchCart = async () => {
    dispatch({ type: ACTIONS.SET_LOADING });
    try {
      // Uvek pokušavamo da dobijemo korpu.
      // PurchaseApi će automatski dodati token ako postoji.
      const data = await getCart(); 
      dispatch({ type: ACTIONS.SET_CART, payload: data });
    } catch (error) {
      // Ako API vrati 401 (Unauthorized) ili neku drugu grešku,
      // postavićemo grešku i isprazniti korpu.
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Could not fetch cart.' });
      dispatch({ type: ACTIONS.SET_CART, payload: { Items: [], TotalPrice: 0 } });
    }
  };

  // Učitavanje korpe pri prvom renderovanju komponente.
  // Prazan niz zavisnosti `[]` znači da će se ovo izvršiti samo jednom.
  useEffect(() => {
    fetchCart();
  }, []);

  const addItemToCart = async (tourId) => {
    try {
      const data = await addToCart(tourId); 
      dispatch({ type: ACTIONS.SET_CART, payload: data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  const removeItemFromCart = async (tourId) => {
     try {
      const data = await removeFromCart(tourId);
      dispatch({ type: ACTIONS.SET_CART, payload: data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  const checkoutCart = async () => {
    try {
      await checkout();
      await fetchCart(); 
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  // --- Funkcije za upravljanje vidljivošću korpe ---

  const openCart = () => dispatch({ type: ACTIONS.OPEN_CART });
  const closeCart = () => dispatch({ type: ACTIONS.CLOSE_CART });

  // Vrednosti koje pružamo celoj aplikaciji (ostaju iste)
  const value = {
    cart: state.cart,
    cartItemCount: state.cart?.Items?.length || 0,
    loading: state.loading,
    error: state.error,
    isCartOpen: state.isCartOpen,
    addItemToCart,
    removeItemFromCart,
    checkoutCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 5. Custom Hook - ostaje isti
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}