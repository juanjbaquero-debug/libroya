"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cover } from "../components/Cover";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load(nextQuery, nextCategory) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextCategory) params.set("category", nextCategory);
    const suffix = params.toString() ? `?${params}` : "";
    setLoading(true);
    setError("");
    api(`/api/books${suffix}`)
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load("", "");
    api("/api/books")
      .then((list) => setCategories([...new Set(list.map((book) => book.category))].sort()))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-3xl bg-ink px-6 py-10 text-cream md:grid-cols-[1.4fr_1fr] md:px-10">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cream/70">Librería digital</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Libros para leer hoy, en casa o en el camino.</h1>
          <p className="mt-4 max-w-xl text-cream/80">
            Elige un título, paga con PayPal Sandbox y sigue el envío de tu licencia o de tu ejemplar físico.
          </p>
        </div>
        <form
          className="flex flex-col justify-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            load(query.trim(), category);
          }}
        >
          <label className="text-sm text-cream/70" htmlFor="q">
            Buscar por título o autor
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field text-ink"
              placeholder="Por ejemplo, algoritmos"
            />
            <button className="btn" type="submit">
              Buscar
            </button>
          </div>
        </form>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-sm ${category === "" ? "bg-ink text-cream" : "bg-paper text-ink"}`}
          onClick={() => {
            setCategory("");
            load(query.trim(), "");
          }}
        >
          Todas
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm ${category === item ? "bg-ink text-cream" : "bg-paper text-ink"}`}
            onClick={() => {
              setCategory(item);
              load(query.trim(), item);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {loading ? (
        <p className="text-muted">Cargando el catálogo…</p>
      ) : books.length === 0 ? (
        <p className="text-muted">No hay libros con ese criterio.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book._id}>
              <Link href={`/libro/${book._id}`} className="block overflow-hidden rounded-3xl bg-paper shadow-card">
                <Cover book={book} className="aspect-[3/4]" />
                <div className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">{book.category}</p>
                  <h2 className="font-serif text-2xl leading-tight">{book.title}</h2>
                  <p className="text-sm text-muted">{book.author}</p>
                  <p className="pt-2 font-semibold">{formatMoney(book.price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
