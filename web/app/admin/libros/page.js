"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "../../../components/RequireAuth";
import { api } from "../../../lib/api";
import { formatMoney } from "../../../lib/format";

const emptyForm = {
  title: "",
  author: "",
  description: "",
  category: "",
  price: "",
  image: "",
  stock: "0",
  active: true,
};

function BooksAdmin() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api("/api/books?includeInactive=1")
      .then(setBooks)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(book) {
    setEditing(book._id);
    setForm({
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      price: String(book.price),
      image: book.image || "",
      stock: String(book.stock),
      active: book.active,
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    try {
      if (editing) {
        await api(`/api/books/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/books", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStock(book, stock) {
    setError("");
    try {
      await api(`/api/books/${book._id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock: Number(stock) }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(book) {
    if (!window.confirm(`¿Eliminar «${book.title}»?`)) return;
    setError("");
    try {
      await api(`/api/books/${book._id}`, { method: "DELETE" });
      if (editing === book._id) {
        setEditing(null);
        setForm(emptyForm);
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form className="space-y-3 rounded-3xl bg-paper p-6 shadow-card" onSubmit={onSubmit}>
        <h1 className="font-serif text-3xl">{editing ? "Editar libro" : "Nuevo libro"}</h1>
        {[
          ["title", "Título"],
          ["author", "Autor"],
          ["category", "Categoría"],
          ["image", "URL de imagen"],
        ].map(([field, label]) => (
          <label key={field} className="block text-sm">
            {label}
            <input className="field mt-1" required={field !== "image"} value={form[field]} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
        <label className="block text-sm">
          Descripción
          <textarea className="field mt-1 min-h-28" required value={form.description} onChange={(event) => update("description", event.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Precio USD
            <input className="field mt-1" type="number" min="0" step="0.01" required value={form.price} onChange={(event) => update("price", event.target.value)} />
          </label>
          <label className="block text-sm">
            Stock
            <input className="field mt-1" type="number" min="0" step="1" required value={form.stock} onChange={(event) => update("stock", event.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} />
          Visible en el catálogo
        </label>
        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear libro"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {books.map((book) => (
          <li key={book._id} className="rounded-3xl bg-paper p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">{book.title}</h2>
                <p className="text-sm text-muted">
                  {book.author} · {book.category} · {formatMoney(book.price)}
                  {!book.active ? " · oculto" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => startEdit(book)}>
                  Editar
                </button>
                <button type="button" className="btn-ghost" onClick={() => remove(book)}>
                  Eliminar
                </button>
              </div>
            </div>
            <form
              key={`${book._id}-${book.stock}`}
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                updateStock(book, data.get("stock"));
              }}
            >
              <label className="text-sm">
                Licencias
                <input name="stock" type="number" min="0" step="1" defaultValue={book.stock} className="field mt-1 w-28" />
              </label>
              <button className="btn" type="submit">
                Actualizar stock
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminBooksPage() {
  return (
    <RequireAuth role="admin">
      <BooksAdmin />
    </RequireAuth>
  );
}
