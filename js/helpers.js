
export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];
export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function on(selector, event, handler, {required=true} = {}) {
  const element = typeof selector === "string" ? $(selector) : selector;
  if (!element) {
    if (required) console.warn(`[Mimi Muscu] Élément absent: ${selector}`);
    return null;
  }
  element.addEventListener(event, handler);
  return element;
}

export function setHidden(selector, hidden) {
  const el = typeof selector === "string" ? $(selector) : selector;
  if (el) el.classList.toggle("hidden", !!hidden);
}

export function openLayer(selector) {
  const el = typeof selector === "string" ? $(selector) : selector;
  if (!el) return;
  el.classList.remove("hidden");
  document.body.classList.add("lock");
}

export function closeLayer(selector, {keepLocked=false} = {}) {
  const el = typeof selector === "string" ? $(selector) : selector;
  if (!el) return;
  el.classList.add("hidden");
  if (!keepLocked) {
    const anyOpen = [...document.querySelectorAll(".modal,.focus")]
      .some(x => !x.classList.contains("hidden"));
    if (!anyOpen) document.body.classList.remove("lock");
  }
}

export function formatDuration(seconds=0) {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, seconds % 60);
  return `${m}:${String(s).padStart(2,"0")}`;
}
