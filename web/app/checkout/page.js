"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "../../components/RequireAuth";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useCart } from "../../lib/cart";
import { formatMoney } from "../../lib/format";

const emptyShipping = { name: "", email: "", phone: "", address: "", city: "" };

function CheckoutForm() {
  const { user } = useAuth();
  const { items, removeMany } = useCart();
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [deliveryType, setDeliveryType] = useState("digital");
  const [shipping, setShipping] = useState(emptyShipping);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!user) return;
    setShipping((current) => ({
      ...current,
      name: current.name || user.name || "",
      email: current.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    api("/api/books")
      .then(setBooks)
      .catch((err) => setError(err.message));
  }, []);

  const lines = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        book: books.find((entry) => entry._id === item.bookId) || null,
      })),
    [items, books]
  );

  const preview = lines.reduce((sum, line) => sum + (line.book ? line.book.price * line.quantity : 0), 0);
  const missing = lines.some((line) => !line.book);

  function updateField(field, value) {
    setShipping((current) => ({ ...current, [field]: value }));
  }

  async function createOrder(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({ bookId: item.bookId, quantity: item.quantity })),
          deliveryType,
          shipping,
        }),
      });
      setOrder(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !order) {
    return <p className="text-muted">El carrito está vacío.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form className="space-y-4 rounded-3xl bg-paper p-6 shadow-card" onSubmit={createOrder}>
        <h1 className="font-serif text-4xl">Entrega</h1>
        <fieldset className="flex flex-wrap gap-3" disabled={Boolean(order)}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="delivery"
              checked={deliveryType === "digital"}
              onChange={() => setDeliveryType("digital")}
            />
            Digital
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="delivery"
              checked={deliveryType === "fisica"}
              onChange={() => setDeliveryType("fisica")}
            />
            Física
          </label>
        </fieldset>
        <label className="block text-sm">
          Nombre
          <input className="field mt-1" required value={shipping.name} disabled={Boolean(order)} onChange={(event) => updateField("name", event.target.value)} />
        </label>
        <label className="block text-sm">
          Correo
          <input className="field mt-1" type="email" required value={shipping.email} disabled={Boolean(order)} onChange={(event) => updateField("email", event.target.value)} />
        </label>
        {deliveryType === "fisica" && (
          <>
            <label className="block text-sm">
              Teléfono
              <input className="field mt-1" required value={shipping.phone} disabled={Boolean(order)} onChange={(event) => updateField("phone", event.target.value)} />
            </label>
            <label className="block text-sm">
              Dirección
              <input className="field mt-1" required value={shipping.address} disabled={Boolean(order)} onChange={(event) => updateField("address", event.target.value)} />
            </label>
            <label className="block text-sm">
              Ciudad
              <input className="field mt-1" required value={shipping.city} disabled={Boolean(order)} onChange={(event) => updateField("city", event.target.value)} />
            </label>
          </>
        )}
        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {!order && (
          <button className="btn" type="submit" disabled={submitting || missing || items.length === 0}>
            {submitting ? "Creando pedido…" : "Confirmar datos y ver total"}
          </button>
        )}
      </form>

      <aside className="space-y-4 rounded-3xl bg-paper p-6 shadow-card">
        <h2 className="font-serif text-2xl">Resumen</h2>
        <ul className="space-y-2 text-sm">
          {(order
            ? order.items.map((item) => ({
                key: String(item.book),
                title: item.title,
                quantity: item.quantity,
                price: item.price,
              }))
            : lines
                .filter((line) => line.book)
                .map((line) => ({
                  key: line.bookId,
                  title: line.book.title,
                  quantity: line.quantity,
                  price: line.book.price,
                }))
          ).map((line) => (
            <li key={line.key} className="flex justify-between gap-3">
              <span>
                {line.title} × {line.quantity}
              </span>
              <span>{formatMoney(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          {order ? "Total calculado por el servidor" : "Vista previa. El servidor recalcula el total al confirmar."}
        </p>
        <p className="text-3xl font-semibold">{formatMoney(order ? order.total : preview)}</p>
        {missing && !order && <p className="text-sm text-red-800">Quita del carrito los libros que ya no están disponibles.</p>}
        {order && !clientId && (
          <p className="text-sm text-muted">Configura NEXT_PUBLIC_PAYPAL_CLIENT_ID para mostrar el botón de PayPal.</p>
        )}
        {order && clientId && (
          <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture" }}>
            <PayPalButtons
              style={{ layout: "vertical", label: "pay" }}
              createOrder={async () => {
                try {
                  const result = await api("/api/payments/paypal/create", {
                    method: "POST",
                    body: JSON.stringify({ orderId: order._id }),
                  });
                  return result.paypalOrderId;
                } catch (err) {
                  setError(err.message);
                  throw err;
                }
              }}
              onApprove={async () => {
                try {
                  await api("/api/payments/paypal/capture", {
                    method: "POST",
                    body: JSON.stringify({ orderId: order._id }),
                  });
                  removeMany(order.items.map((item) => String(item.book)));
                  router.push("/pedidos");
                } catch (err) {
                  setError(err.message);
                }
              }}
              onError={() => setError("PayPal no pudo completar el pago")}
            />
          </PayPalScriptProvider>
        )}
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutForm />
    </RequireAuth>
  );
}
