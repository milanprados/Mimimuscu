/**
 * Bibliothèque d'exercices.
 *
 * Hiérarchie :
 *   famille (ex. Pompes)
 *      ├─ plus facile
 *      ├─ référence
 *      ├─ variantes
 *      └─ plus difficile
 *
 * Le texte des guides reste dans data/exercises.json.
 */
import { $, $$, on, openLayer, closeLayer } from "../utils/dom.js";

const CATEGORIES = [
  "Tous",
  "Haut du corps",
  "Jambes",
  "Fessiers",
  "Dos",
  "Core",
  "Cardio",
  "Full body",
  "Mobilité",
];

const TIER_LABELS = {
  easier: "Plus facile",
  standard: "Référence",
  variations: "Variantes",
  harder: "Plus difficile",
};

export function createExerciseLibrary({ EXERCISES, FAMILIES }) {
  let selectedCategory = "Tous";
  let quietOnly = true;
  let equipmentFreeOnly = true;

  let currentFamilyId = null;
  let currentExerciseId = null;

  function getFamily(familyId) {
    return FAMILIES.find((family) => family.id === familyId);
  }

  function getVisibleExercisesForFamily(family) {
    return (family.allIds || [])
      .map((id) => EXERCISES[id])
      .filter(Boolean)
      .filter((exercise) => {
        if (quietOnly && !exercise.quiet) return false;
        if (equipmentFreeOnly && exercise.equipment !== "none") return false;
        return true;
      });
  }

  function familyMatchesSearch(family, query) {
    const visibleExercises = getVisibleExercisesForFamily(family);

    if (!visibleExercises.length) return false;

    if (selectedCategory !== "Tous" && family.category !== selectedCategory) {
      return false;
    }

    if (!query) return true;

    const searchableText = [
      family.name,
      family.category,
      family.description,
      ...(family.search_terms || []),
      ...visibleExercises.flatMap((exercise) => [
        exercise.name,
        exercise.primary,
        exercise.secondary,
        exercise.description,
      ]),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  function renderFilters() {
    $("#chips").innerHTML = `
      <button class="filter-chip utility ${quietOnly ? "active" : ""}" id="quietFilter">
        Silencieux
      </button>
      <button class="filter-chip utility ${equipmentFreeOnly ? "active" : ""}" id="equipmentFilter">
        Sans matériel
      </button>
      ${CATEGORIES.map(
        (category) => `
        <button
          class="filter-chip ${category === selectedCategory ? "active" : ""}"
          data-category="${category}"
        >
          ${category}
        </button>
      `,
      ).join("")}`;

    on("#quietFilter", "click", () => {
      quietOnly = !quietOnly;
      renderFilters();
      renderFamilies();
    });

    on("#equipmentFilter", "click", () => {
      equipmentFreeOnly = !equipmentFreeOnly;
      renderFilters();
      renderFamilies();
    });

    $$("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;
        renderFilters();
        renderFamilies();
      });
    });
  }

  function renderFamilies() {
    const query = ($("#search")?.value || "").trim().toLowerCase();

    const families = FAMILIES.filter((family) =>
      familyMatchesSearch(family, query),
    ).sort((a, b) => a.name.localeCompare(b.name, "fr"));

    $("#exerciseCount").textContent =
      `${families.length} familles · ${Object.keys(EXERCISES).length} mouvements`;

    $("#exerciseList").innerHTML = families
      .map((family) => {
        const baseExercise = EXERCISES[family.base_id];
        const visibleCount = getVisibleExercisesForFamily(family).length;

        return `
        <button class="exercise-card family-card" data-family-id="${family.id}">
          <div class="exercise-thumb">
            <img
              src="${baseExercise.thumb || baseExercise.images[0]}"
              alt=""
              loading="lazy"
              decoding="async"
            >
          </div>

          <div class="exercise-copy">
            <div class="exercise-card-top">
              <strong>${family.name}</strong>
              <span class="exercise-arrow">→</span>
            </div>

            <small>${family.description}</small>

            <div class="exercise-meta">
              <span>${family.category}</span>
              <span>${visibleCount} mouvement${visibleCount > 1 ? "s" : ""}</span>
            </div>
          </div>
        </button>`;
      })
      .join("");

    $$("[data-family-id]").forEach((button) => {
      button.addEventListener("click", () => {
        openFamily(button.dataset.familyId);
      });
    });
  }

  function renderVariantCard(exerciseId) {
    const exercise = EXERCISES[exerciseId];
    if (!exercise) return "";

    if (quietOnly && !exercise.quiet) return "";
    if (equipmentFreeOnly && exercise.equipment !== "none") return "";

    return `
      <button class="variant-card" data-exercise-id="${exerciseId}">
        <div class="variant-thumb">
          <img src="${exercise.thumb || exercise.images[0]}" alt="">
        </div>
        <div>
          <strong>${exercise.name}</strong>
          <small>${exercise.primary}</small>
        </div>
        <span>→</span>
      </button>`;
  }

  function renderVariantGroup(family, tier) {
    const exerciseIds = (family.variants[tier] || []).filter(
      (id) => id !== family.base_id,
    );

    const cards = exerciseIds.map(renderVariantCard).filter(Boolean).join("");

    if (!cards) return "";

    return `
      <section class="variant-section tier-${tier}">
        <div class="variant-heading">
          <span>${TIER_LABELS[tier]}</span>
        </div>
        ${cards}
      </section>`;
  }

  function bindExerciseLinks() {
    $$("[data-exercise-id]").forEach((button) => {
      button.addEventListener("click", () => {
        openExercise(button.dataset.exerciseId);
      });
    });
  }

  function openFamily(familyId) {
    const family = getFamily(familyId);
    if (!family) return;

    currentFamilyId = familyId;
    currentExerciseId = null;

    const baseExercise = EXERCISES[family.base_id];

    $("#modalTitle").textContent = family.name;
    $("#modalBody").innerHTML = `
      <div class="family-hero">
        <div class="family-visual">
          <img src="${baseExercise.thumb || baseExercise.images[0]}" alt="">
        </div>
        <div>
          <span class="guide-kicker">${family.category}</span>
          <p>${family.description}</p>
        </div>
      </div>

      <div class="family-base">
        <span class="eyebrow">MOUVEMENT DE RÉFÉRENCE</span>
        <button class="base-exercise-card" data-exercise-id="${family.base_id}">
          <div>
            <strong>${baseExercise.name}</strong>
            <small>${baseExercise.primary} · ${baseExercise.secondary}</small>
          </div>
          <span>Guide →</span>
        </button>
      </div>

      <div class="variant-groups">
        ${["easier", "standard", "variations", "harder"]
          .map((tier) => renderVariantGroup(family, tier))
          .join("")}
      </div>`;

    openLayer("#modal");
    bindExerciseLinks();
  }

  function renderRelatedExerciseButtons(ids = []) {
    return ids
      .map((id) => {
        const exercise = EXERCISES[id];
        if (!exercise) return "";

        return `
        <button data-related-exercise="${id}">
          <strong>${exercise.name}</strong>
          <span>→</span>
        </button>`;
      })
      .join("");
  }

  function renderGuideSteps(items = []) {
    return items
      .map(
        (text, index) => `
      <li>
        <span>${index + 1}</span>
        <p>${text}</p>
      </li>`,
      )
      .join("");
  }

  function openExercise(exerciseId) {
    const exercise = EXERCISES[exerciseId];
    if (!exercise) return;

    currentExerciseId = exerciseId;
    $("#modalTitle").textContent = exercise.name;

    const guide = exercise.guide || {};

    $("#modalBody").innerHTML = `
      <div class="guide-hero">
        <div class="guide-kicker">
          ${exercise.category} · ${exercise.mode === "time" ? "Temps" : "Répétitions"}
        </div>

        <p class="exercise-description">${exercise.description}</p>

        <div class="guide-images">
          <figure><span>Départ</span><img src="${exercise.images[0]}" alt=""></figure>
          <figure><span>Fin</span><img src="${exercise.images[1]}" alt=""></figure>
        </div>

        <div class="muscle-grid">
          <div>
            <small>Principaux</small>
            <strong>${exercise.primary}</strong>
          </div>
          <div>
            <small>Secondaires</small>
            <strong>${exercise.secondary || "—"}</strong>
          </div>
          <div class="wide">
            <small>Stabilisateurs</small>
            <strong>${exercise.stabilizers || "—"}</strong>
          </div>
        </div>
      </div>

      ${
        guide.specific_note
          ? `
        <div class="specific-note">
          <span>À retenir</span>
          <p>${guide.specific_note}</p>
        </div>`
          : ""
      }

      <section class="guide-section">
        <div class="guide-section-label">Installation</div>
        <h3>Avant de commencer</h3>
        <ol class="guide-steps">${renderGuideSteps(guide.setup)}</ol>
      </section>

      <section class="guide-section">
        <div class="guide-section-label">Exécution</div>
        <h3>Étape par étape</h3>
        <ol class="guide-steps">${renderGuideSteps(guide.execution)}</ol>
      </section>

      <div class="guide-two">
        <section class="guide-section tips-section">
          <div class="guide-section-label">Tips</div>
          <ul>${(guide.tips || []).map((text) => `<li>${text}</li>`).join("")}</ul>
        </section>

        <section class="guide-section danger">
          <div class="guide-section-label">Erreurs à éviter</div>
          <ul>${(guide.errors || []).map((text) => `<li>${text}</li>`).join("")}</ul>
        </section>
      </div>

      <section class="guide-section breathing-card">
        <div class="guide-section-label">Respiration</div>
        <p>${guide.breathing || exercise.breathing}</p>
      </section>

      ${
        (guide.easier_ids || []).length || (guide.harder_ids || []).length
          ? `
        <section class="guide-section progression-links">
          <div class="guide-section-label">Changer de niveau</div>

          ${
            (guide.easier_ids || []).length
              ? `
            <div class="relation-block">
              <small>Plus simple</small>
              ${renderRelatedExerciseButtons(guide.easier_ids)}
            </div>`
              : ""
          }

          ${
            (guide.harder_ids || []).length
              ? `
            <div class="relation-block">
              <small>Plus difficile</small>
              ${renderRelatedExerciseButtons(guide.harder_ids)}
            </div>`
              : ""
          }
        </section>`
          : ""
      }`;

    $$("[data-related-exercise]").forEach((button) => {
      button.addEventListener("click", () => {
        openExercise(button.dataset.relatedExercise);
      });
    });
  }

  function goBackOrClose() {
    if (currentExerciseId && currentFamilyId) {
      currentExerciseId = null;
      openFamily(currentFamilyId);
      return;
    }

    currentExerciseId = null;
    currentFamilyId = null;
    closeLayer("#modal");
  }

  on("#search", "input", renderFamilies);
  on("#closeModal", "click", goBackOrClose);

  renderFilters();
  renderFamilies();

  return {
    render: renderFamilies,
    closeGuide() {
      currentExerciseId = null;
      currentFamilyId = null;
      closeLayer("#modal");
    },
  };
}
