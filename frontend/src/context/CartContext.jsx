import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('herbal-might-cart') || '[]'); } catch { return []; } });
  useEffect(() => localStorage.setItem('herbal-might-cart', JSON.stringify(items)), [items]);
  const add = (product, quantity = 1) => setItems((old) => {
    const existing = old.find((x) => x.id === product.id);
    return existing ? old.map((x) => x.id === product.id ? { ...x, quantity: x.quantity + quantity } : x) : [...old, { ...product, quantity }];
  });
  const setQuantity = (id, quantity) => setItems((old) => quantity < 1 ? old.filter((x) => x.id !== id) : old.map((x) => x.id === id ? { ...x, quantity } : x));
  const clear = () => setItems([]);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return <CartContext.Provider value={{ items, add, setQuantity, clear, total, count }}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
