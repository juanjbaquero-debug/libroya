export function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export const SHIPPING_STATUSES = ["pendiente", "procesando", "enviado", "entregado"];

export const SHIPPING_LABELS = {
  pendiente: "Pendiente",
  procesando: "Procesando",
  enviado: "Enviado",
  entregado: "Entregado",
};

export const PAYMENT_LABELS = {
  pendiente: "Pago pendiente",
  pagado: "Pagado",
  fallido: "Pago fallido",
};
