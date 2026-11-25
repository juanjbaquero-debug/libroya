"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "libroya_cart";
const CartContext = createContext(null);

function normalize(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.bookId === "string" && Number.isInteger(item.quantity))
    .map((item) => ({ bookId: item.bookId, quantity: Math.min(20, Math.max(1, item.quantity)) }));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(normalize(JSON.parse(localStorage.getItem(KEY) || "[]")));
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      add(bookId, quantity = 1) {
        setItems((current) => {
          const found = current.find((item) => item.bookId === bookId);
          if (!found) return [...current, { bookId, quantity: Math.min(20, quantity) }];
          return current.map((item) =>
            item.bookId === bookId ? { ...item, quantity: Math.min(20, item.quantity + quantity) } : item
          );
        });
      },
      setQuantity(bookId, quantity) {
        setItems((current) => {
          if (quantity < 1) return current.filter((item) => item.bookId !== bookId);
          return current.map((item) =>
            item.bookId === bookId ? { ...item, quantity: Math.min(20, quantity) } : item
          );
        });
      },
      remove(bookId) {
        setItems((current) => current.filter((item) => item.bookId !== bookId));
      },
      removeMany(bookIds) {
        const drop = new Set(bookIds);
        setItems((current) => current.filter((item) => !drop.has(item.bookId)));
      },
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}
