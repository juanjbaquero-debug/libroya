"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";

export function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = typeof window !== "undefined" ? window.location.pathname : "/";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (role && user.role !== role) router.replace("/");
  }, [loading, user, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return <p className="text-muted">Cargando…</p>;
  }

  return children;
}
