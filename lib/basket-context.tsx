'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';

export interface BasketItem {
  id: number;
  name: string;
  priceCzk: number;
  quantity: number;
}

interface BasketContextType {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearBasket: () => void;
  total: number;
  count: number;
}

const BasketContext = createContext<BasketContextType | null>(null);

type Action =
  | { type: 'ADD'; item: Omit<BasketItem, 'quantity'> }
  | { type: 'REMOVE'; id: number }
  | { type: 'UPDATE_QTY'; id: number; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: BasketItem[] };

function reducer(state: BasketItem[], action: Action): BasketItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.items;
    case 'ADD': {
      const existing = state.find((i) => i.id === action.item.id);
      if (existing) {
        return state.map((i) => i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter((i) => i.id !== action.id);
      return state.map((i) => i.id === action.id ? { ...i, quantity: action.qty } : i);
    case 'CLEAR':
      return [];
  }
}

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('duj_basket');
      if (saved) dispatch({ type: 'HYDRATE', items: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('duj_basket', JSON.stringify(items));
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.priceCzk * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <BasketContext.Provider value={{
      items,
      addItem: (item) => dispatch({ type: 'ADD', item }),
      removeItem: (id) => dispatch({ type: 'REMOVE', id }),
      updateQuantity: (id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }),
      clearBasket: () => dispatch({ type: 'CLEAR' }),
      total,
      count,
    }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be used within BasketProvider');
  return ctx;
}
