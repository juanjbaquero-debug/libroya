"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cover } from "../../components/Cover";
import { api } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { formatMoney } from "../../lib/format";

export default function CartPage() {
  const { items, setQuantity, remove } = useCart();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/books")
      .then(setBooks)
      .catch((err) => setError(err.message));
  }, []);

  const lines = items.map((item) => {
    const book = books.find((entry) => entry._id === item.bookId);
    return { ...item, book };
  });
  const preview = lines.reduce((sum, line) => sum + (line.book ? line.book.price * line.quantity : 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Carrito</h1>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {items.length === 0 ? (
        <div className="rounded-3xl bg-paper p-8 shadow-card">
          <p>Todavía no agregaste libros.</p>
          <Link href="/" className="btn mt-4">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <ul className="space-y-4">
            {lines.map((line) => (
              <li key={line.bookId} className="flex gap-4 rounded-3xl bg-paper p-4 shadow-card">
                {line.book ? (
                  <Cover book={line.book} className="h-28 w-20 shrink-0 rounded-2xl" />
                ) : (
                  <div className="h-28 w-20 shrink-0 rounded-2xl bg-line" />
                )}
                <div className="flex flex-1 flex-col gap-2">
                  {line.book ? (
                    <>
                      <h2 className="font-serif text-2xl leading-tight">{line.book.title}</h2>
                      <p className="text-sm text-muted">{line.book.author}</p>
                      <p className="font-semibold">{formatMoney(line.book.price)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">Este libro ya no está disponible.</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={line.quantity}
                      aria-label="Cantidad"
                      className="field w-24"
                      onChange={(event) => setQuantity(line.bookId, Number(event.target.value) || 1)}
                    />
                    <button type="button" className="text-sm font-semibold text-terra" onClick={() => remove(line.bookId)}>
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-3xl bg-paper p-6 shadow-card">
            <h2 className="font-serif text-2xl">Resumen</h2>
            <p className="mt-2 text-sm text-muted">El total definitivo se calcula en el servidor al confirmar el pedido.</p>
            <p className="mt-4 text-3xl font-semibold">{formatMoney(preview)}</p>
            <Link href="/checkout" className="btn mt-6 w-full">
              Continuar con la entrega
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
