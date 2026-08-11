/**
 * Navigation principale.
 * Toute navigation ferme les couches temporaires pour éviter les overlays fantômes.
 */
import {$, $$, closeAllLayers} from "../utils/dom.js";

export function createNavigation({onTabChanged = () => {}} = {}) {
  function showTab(tabName) {
    closeAllLayers();

    $$("main > section").forEach(section => {
      section.classList.add("hidden");
      section.setAttribute("aria-hidden", "true");
    });

    const target = $(`#${tabName}Tab`);
    if (!target) {
      console.warn(`[Mimi Muscu] Onglet inconnu : ${tabName}`);
      return;
    }

    target.classList.remove("hidden");
    target.setAttribute("aria-hidden", "false");

    $$(".tabs button").forEach(button => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    window.scrollTo({top: 0, behavior: "instant"});
    onTabChanged(tabName);
  }

  $$(".tabs button").forEach(button => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  return {showTab};
}
