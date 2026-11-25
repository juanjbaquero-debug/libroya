"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Cover } from "../../../components/Cover";
import { api } from "../../../lib/api";
import { useCart } from "../../../lib/cart";
import { formatMoney } from "../../../lib/format";

export default function BookPage() {
  const params = useParams();
  const { add } = useCart();
  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!params.id) return;
    api(`/api/books/${params.id}`)
      .then(setBook)
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>;
  if (!book) return <p className="text-muted">Cargando libro…</p>;

  const max = Math.min(20, book.stock);

  return (
    <article className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr]">
      <Cover book={book} className="aspect-[3/4] rounded-3xl" />
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.16em] text-muted">{book.category}</p>
        <h1 className="font-serif text-4xl leading-tight">{book.title}</h1>
        <p className="text-lg text-muted">{book.author}</p>
        <p className="max-w-2xl leading-relaxed">{book.description}</p>
        <p className="font-serif text-3xl">{formatMoney(book.price)}</p>
        <p className="text-sm text-muted">
          {book.stock > 0 ? `${book.stock} licencias disponibles` : "Sin licencias disponibles"}
        </p>
        {book.stock > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm" htmlFor="qty">
              Cantidad
            </label>
            <input
              id="qty"
              type="number"
              min={1}
              max={max}
              value={quantity}
              onChange={(event) => setQuantity(Math.min(max, Math.max(1, Number(event.target.value) || 1)))}
              className="field w-24"
            />
            <button
              type="button"
              className="btn"
              onClick={() => {
                add(book._id, quantity);
                setNotice("Agregado al carrito");
              }}
            >
              Agregar al carrito
            </button>
            <Link href="/carrito" className="btn-ghost">
              Ver carrito
            </Link>
          </div>
        )}
        {notice && <p className="text-sm text-terra-dark">{notice}</p>}
      </div>
    </article>
  );
}
