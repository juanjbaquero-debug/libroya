"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "../../components/RequireAuth";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { connectSocket } from "../../lib/socket";

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/orders?mine=1")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;
    const onUpdate = (order) => {
      setOrders((current) => {
        const index = current.findIndex((item) => item._id === order._id);
        if (index === -1) return [order, ...current];
        const next = [...current];
        next[index] = order;
        return next;
      });
    };
    socket.on("order:updated", onUpdate);
    return () => {
      socket.off("order:updated", onUpdate);
      socket.disconnect();
    };
  }, []);

  if (error) return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">Tus pedidos</h1>
      <p className="text-sm text-muted">El estado de envío se actualiza en vivo.</p>
      {orders.length === 0 ? (
        <p className="rounded-3xl bg-paper p-6 text-muted shadow-card">Todavía no tienes pedidos.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="rounded-3xl bg-paper p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
                  <h2 className="font-serif text-2xl">{formatMoney(order.total)}</h2>
                  <p className="text-sm text-muted">{order.deliveryType === "fisica" ? "Entrega física" : "Entrega digital"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge kind="payment" value={order.paymentStatus} />
                  {order.paymentStatus === "pagado" && <StatusBadge kind="shipping" value={order.shippingStatus} />}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={`${order._id}-${item.book}`}>
                    {item.title} × {item.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersList />
    </RequireAuth>
  );
}
