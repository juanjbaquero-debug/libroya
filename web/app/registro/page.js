"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(name, email, password);
      router.push("/");
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
      <h1 className="font-serif text-4xl">Crear cuenta</h1>
      <p className="text-sm text-muted">El registro público crea una cuenta de cliente.</p>
      <label className="block text-sm">
        Nombre
        <input className="field mt-1" required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block text-sm">
        Correo
        <input className="field mt-1" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="block text-sm">
        Contraseña
        <input className="field mt-1" type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <button className="btn w-full" type="submit" disabled={submitting}>
        {submitting ? "Creando…" : "Registrarme"}
      </button>
      <p className="text-sm text-muted">
        ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-ink">Entra</Link>
      </p>
    </form>
  );
}
