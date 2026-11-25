import { PAYMENT_LABELS, SHIPPING_LABELS } from "../lib/format";

const PAYMENT_STYLES = {
  pendiente: "bg-amber-100 text-amber-900",
  pagado: "bg-emerald-100 text-emerald-900",
  fallido: "bg-red-100 text-red-900",
};

const SHIPPING_STYLES = {
  pendiente: "bg-stone-200 text-stone-800",
  procesando: "bg-sky-100 text-sky-900",
  enviado: "bg-indigo-100 text-indigo-900",
  entregado: "bg-emerald-100 text-emerald-900",
};

export function StatusBadge({ kind, value }) {
  const label = kind === "payment" ? PAYMENT_LABELS[value] || value : SHIPPING_LABELS[value] || value;
  const style = kind === "payment" ? PAYMENT_STYLES[value] : SHIPPING_STYLES[value];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style || "bg-line text-ink"}`}>{label}</span>;
}
