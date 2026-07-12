export function formatMoney(amount: number | string, currency = "EUR") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "numeric",
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("sk-SK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTimeInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
