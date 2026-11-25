"use client";

import { DndContext, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { RequireAuth } from "../../../components/RequireAuth";
import { api } from "../../../lib/api";
import { SHIPPING_LABELS, SHIPPING_STATUSES, formatMoney } from "../../../lib/format";
import { connectSocket } from "../../../lib/socket";

function Column({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={`rounded-3xl bg-paper p-3 shadow-card ${isOver ? "ring-2 ring-terra" : ""}`}
    >
      <h2 className="px-2 py-2 font-serif text-xl">{SHIPPING_LABELS[id]}</h2>
      <div className="min-h-48 space-y-3">{children}</div>
    </section>
  );
}

function Card({ order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order._id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;
  const person = order.user?.name || "Cliente";
  const place = order.deliveryType === "fisica" ? order.shipping?.city || "Envío físico" : "Entrega digital";

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-line bg-cream p-3 ${isDragging ? "opacity-70" : ""}`}
    >
      <button type="button" className="w-full cursor-grab touch-none text-left active:cursor-grabbing" {...listeners} {...attributes}>
        <p className="font-semibold">{person}</p>
        <p className="text-sm text-muted">{place}</p>
        <p className="mt-2 text-sm">{formatMoney(order.total)}</p>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {order.items.map((item) => (
            <li key={`${order._id}-${item.book}`}>
              {item.title} × {item.quantity}
            </li>
          ))}
        </ul>
      </button>
    </article>
  );
}

function Kanban() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function upsert(order) {
    setOrders((current) => {
      const paid = order.paymentStatus === "pagado";
      const index = current.findIndex((item) => item._id === order._id);
      if (!paid) {
        return index === -1 ? current : current.filter((item) => item._id !== order._id);
      }
      if (index === -1) return [order, ...current];
      const next = [...current];
      next[index] = order;
      return next;
    });
  }

  useEffect(() => {
    api("/api/orders?paid=1")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;
    socket.on("order:updated", upsert);
    return () => {
      socket.off("order:updated", upsert);
      socket.disconnect();
    };
  }, []);

  async function onDragEnd(event) {
    const orderId = String(event.active.id);
    const destination = event.over?.id;
    if (!destination || !SHIPPING_STATUSES.includes(String(destination))) return;
    const current = orders.find((order) => order._id === orderId);
    if (!current || current.shippingStatus === destination) return;

    const previous = current.shippingStatus;
    setOrders((list) => list.map((order) => (order._id === orderId ? { ...order, shippingStatus: destination } : order)));
    try {
      const updated = await api(`/api/orders/${orderId}/shipping-status`, {
        method: "PATCH",
        body: JSON.stringify({ shippingStatus: destination }),
      });
      upsert(updated);
    } catch (err) {
      setError(err.message);
      setOrders((list) => list.map((order) => (order._id === orderId ? { ...order, shippingStatus: previous } : order)));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-4xl">Envíos</h1>
        <p className="text-sm text-muted">Arrastra un pedido pagado entre Pendiente, Procesando, Enviado y Entregado.</p>
      </div>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SHIPPING_STATUSES.map((status) => (
            <Column key={status} id={status}>
              {orders
                .filter((order) => order.shippingStatus === status)
                .map((order) => (
                  <Card key={order._id} order={order} />
                ))}
            </Column>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <RequireAuth role="admin">
      <Kanban />
    </RequireAuth>
  );
}
