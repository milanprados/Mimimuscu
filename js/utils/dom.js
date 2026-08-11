/**
 * Primitives DOM partagées.
 * Centraliser les couches/modales ici évite les overlays qui restent ouverts.
 */
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function on(
  selectorOrElement,
  eventName,
  handler,
  { required = true } = {},
) {
  const element =
    typeof selectorOrElement === "string"
      ? $(selectorOrElement)
      : selectorOrElement;

  if (!element) {
    if (required)
      console.warn(`[Mimi Muscu] Élément absent : ${selectorOrElement}`);
    return null;
  }

  element.addEventListener(eventName, handler);
  return element;
}

const LAYER_SELECTOR = ".modal,.focus";

function updateBodyScrollLock() {
  const hasOpenLayer = [...document.querySelectorAll(LAYER_SELECTOR)].some(
    (element) => !element.classList.contains("hidden"),
  );
  document.body.classList.toggle("lock", hasOpenLayer);
}

export function openLayer(selectorOrElement) {
  const element =
    typeof selectorOrElement === "string"
      ? $(selectorOrElement)
      : selectorOrElement;
  if (!element) return;
  element.classList.remove("hidden");
  element.setAttribute("aria-hidden", "false");
  element.scrollTop = 0;
  updateBodyScrollLock();
}

export function closeLayer(selectorOrElement, { keepLocked = false } = {}) {
  const element =
    typeof selectorOrElement === "string"
      ? $(selectorOrElement)
      : selectorOrElement;
  if (!element) return;
  element.classList.add("hidden");
  element.setAttribute("aria-hidden", "true");
  if (!keepLocked) updateBodyScrollLock();
}

export function closeAllLayers({ except = [] } = {}) {
  const keep = new Set(Array.isArray(except) ? except : [except]);

  [...document.querySelectorAll(LAYER_SELECTOR)].forEach((element) => {
    if (!keep.has(element.id) && !keep.has(`#${element.id}`)) {
      element.classList.add("hidden");
      element.setAttribute("aria-hidden", "true");
    }
  });

  updateBodyScrollLock();
}

export function formatDuration(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remaining = Math.floor(safe % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}
