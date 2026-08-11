/**
 * Dates locales.
 * Ne jamais utiliser toISOString().slice(0,10) pour déterminer "aujourd'hui":
 * cela utilise UTC et peut changer de date le soir.
 */
export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function localDayKey(date = new Date()) {
  const d = startOfDay(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDayKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, amount) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function previousDayKey(date = new Date()) {
  return localDayKey(addDays(date, -1));
}

export function mondayOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7;
  return addDays(d, -offset);
}

export function isRestDay(date, restDay) {
  return startOfDay(date).getDay() === Number(restDay);
}

export function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatLongDate(date) {
  const text = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
