"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

export function Header() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-serif text-2xl tracking-tight text-ink">
          LibroYa
        </Link>
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1.5 text-sm md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          Menú
        </button>
        <nav className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-3 border-b border-line bg-cream px-4 py-4 md:static md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:bg-transparent md:p-0`}>
          <Link href="/" className="text-sm font-medium text-ink/80 hover:text-ink" onClick={() => setOpen(false)}>
            Catálogo
          </Link>
          <Link href="/carrito" className="text-sm font-medium text-ink/80 hover:text-ink" onClick={() => setOpen(false)}>
            Carrito{count > 0 ? ` (${count})` : ""}
          </Link>
          {user?.role === "admin" && (
            <>
              <Link href="/admin/libros" className="text-sm font-medium text-ink/80 hover:text-ink" onClick={() => setOpen(false)}>
                Libros
              </Link>
              <Link href="/admin/envios" className="text-sm font-medium text-ink/80 hover:text-ink" onClick={() => setOpen(false)}>
                Envíos
              </Link>
            </>
          )}
          {loading ? (
            <span className="text-sm text-muted">Cargando…</span>
          ) : user ? (
            <>
              <Link href="/pedidos" className="text-sm font-medium text-ink/80 hover:text-ink" onClick={() => setOpen(false)}>
                Pedidos
              </Link>
              <span className="text-sm text-muted">{user.name}</span>
              <button type="button" className="text-left text-sm font-semibold text-terra" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-ink" onClick={() => setOpen(false)}>
                Entrar
              </Link>
              <Link href="/registro" className="btn" onClick={() => setOpen(false)}>
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
