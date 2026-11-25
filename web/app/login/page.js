"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "../../lib/auth";

function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requested = params.get("next") || "/";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (user) {
    return (
      <p>
        Ya tienes sesión. <Link href="/" className="font-semibold text-terra">Volver al catálogo</Link>
      </p>
    );
  }

  return (
    <form className="mx-auto max-w-md space-y-4 rounded-3xl bg-paper p-6 shadow-card" onSubmit={onSubmit}>
      <h1 className="font-serif text-4xl">Entrar</h1>
      <label className="block text-sm">
        Correo
        <input className="field mt-1" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="block text-sm">
        Contraseña
        <input className="field mt-1" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <button className="btn w-full" type="submit" disabled={submitting}>
        {submitting ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-sm text-muted">
        ¿No tienes cuenta? <Link href="/registro" className="font-semibold text-ink">Regístrate</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
