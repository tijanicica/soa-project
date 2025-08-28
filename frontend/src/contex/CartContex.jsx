// U fajlu: src/contex/CartContex.jsx (FINALNA VERZIJA SA CLEANUP FUNKCIJOM)

import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { getCart, addToCart, removeFromCart, checkout } from '../services/PurchaseApi';

const CartContext = createContext();

const ACTIONS = {
  SET_CART: 'set-cart',
  SET_LOADING: 'set-loading',
  SET_ERROR: 'set-error',
  OPEN_CART: 'open-cart',
  CLOSE_CART: 'close-cart',
};

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

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    cart: { Items: [], TotalPrice: 0 },
    loading: true,
    error: null,
    isCartOpen: false,
  });

  // Učitavanje korpe pri prvom renderovanju, zaštićeno od duplog pozivanja u Strict Mode-u
  useEffect(() => {
    let isMounted = true; // Zastavica koja prati da li je ova instanca komponente "živa"

    const fetchCart = async () => {
      dispatch({ type: ACTIONS.SET_LOADING });
      try {
        const data = await getCart(); 
        // Ažuriraj stanje SAMO AKO je komponenta i dalje "živa"
        if (isMounted) {
          dispatch({ type: ACTIONS.SET_CART, payload: data });
        }
      } catch (error) {
        if (isMounted) {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Could not fetch cart.' });
          dispatch({ type: ACTIONS.SET_CART, payload: { Items: [], TotalPrice: 0 } });
        }
      }
    };

    fetchCart();

    // CLEANUP FUNKCIJA
    // Ova funkcija se automatski poziva kada React "uništi" ovu instancu komponente
    return () => {
      isMounted = false; // Postavi zastavicu na false, sprečavajući stare API pozive da ažuriraju stanje
    };
  }, []); // Prazan niz `[]` osigurava da se ovo dešava samo pri prvom "pravom" učitavanju

  
  // Sve ostale funkcije ostaju nepromenjene jer one ne pate od ovog problema
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
      // Nakon checkout-a, ponovo dohvati stanje.
      // Ne treba nam 'isMounted' ovde jer se ova funkcija poziva na zahtev korisnika.
      const data = await getCart();
      dispatch({ type: ACTIONS.SET_CART, payload: data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  };

  const openCart = () => dispatch({ type: ACTIONS.OPEN_CART });
  const closeCart = () => dispatch({ type: ACTIONS.CLOSE_CART });

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

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}