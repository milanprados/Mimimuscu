
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

const layerSelector=".modal,.focus";

function syncBodyLock(){
  const open=[...document.querySelectorAll(layerSelector)]
    .some(el=>!el.classList.contains("hidden"));
  document.body.classList.toggle("lock",open);
}

export function setHidden(selector, hidden) {
  const el=typeof selector==="string"?$(selector):selector;
  if(!el)return;
  el.classList.toggle("hidden",!!hidden);
  el.setAttribute("aria-hidden",hidden?"true":"false");
  syncBodyLock();
}

export function openLayer(selector) {
  const el=typeof selector==="string"?$(selector):selector;
  if(!el)return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden","false");
  el.scrollTop=0;
  syncBodyLock();
}

export function closeLayer(selector,{keepLocked=false}={}) {
  const el=typeof selector==="string"?$(selector):selector;
  if(!el)return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden","true");
  if(!keepLocked)syncBodyLock();
}

export function closeAllLayers({except=[]}={}) {
  const keep=new Set(Array.isArray(except)?except:[except]);
  [...document.querySelectorAll(layerSelector)].forEach(el=>{
    if(!keep.has(`#${el.id}`)&&!keep.has(el.id)){
      el.classList.add("hidden");
      el.setAttribute("aria-hidden","true");
    }
  });
  syncBodyLock();
}

export function formatDuration(seconds=0) {
  const m=Math.floor(seconds/60);
  const s=Math.max(0,seconds%60);
  return `${m}:${String(s).padStart(2,"0")}`;
}
