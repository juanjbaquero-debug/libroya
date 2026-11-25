export function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function toCents(value) {
  return Math.round(Number(value) * 100);
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parsePrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100000) return null;
  return roundMoney(number);
}

export function parseStock(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100000) return null;
  return number;
}
