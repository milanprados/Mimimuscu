/**
 * Onglet Progrès : analyse détaillée.
 * Les calculs sont faits dans core/progression.js ; ici on ne fait que rendre.
 */
import { $ } from "../utils/dom.js";
import { PROGRESSION_AXES, TARGET_EXERCISE_IDS } from "../core/progression.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const percentText = (value) => `${value >= 0 ? "+" : ""}${Math.round(value)}%`;

function formatExerciseValue(exercise, value) {
  if (value == null || value === "") return "—";
  return `${Math.round(value)}${exercise?.mode === "time" ? " s" : exercise?.perSide ? " / côté" : ""}`;
}

function renderAxes(snapshot) {
  return Object.entries(PROGRESSION_AXES)
    .map(([key, axis]) => {
      const value = snapshot.indices[key];
      const gain = value - 100;
      const width = clamp(((value - 70) / 80) * 100, 6, 100);

      return `
      <div class="axis-row">
        <div class="axis-head">
          <div><strong>${axis.label}</strong><small>${axis.hint}</small></div>
          <b>${value}</b>
        </div>
        <div class="axis-track">
          <span style="width:${width}%"></span>
          <i style="left:${clamp(((100 - 70) / 80) * 100, 0, 100)}%"></i>
        </div>
        <div class="axis-foot">
          <span>100 = départ</span>
          <em class="${gain >= 0 ? "up" : "down"}">${percentText(gain)}</em>
        </div>
      </div>`;
    })
    .join("");
}

function progressionNarrative(snapshot, sessionCount) {
  if (sessionCount < 3) {
    return "Ton profil démarre à l’indice 100. Les axes deviennent plus parlants après quelques séances.";
  }

  const axes = Object.entries(PROGRESSION_AXES)
    .map(([key, axis]) => ({
      label: axis.label,
      gain: snapshot.indices[key] - 100,
    }))
    .sort((a, b) => b.gain - a.gain);

  const best = axes[0];
  const lowest = axes.at(-1);

  if (best.gain >= 8 && best.gain - lowest.gain >= 8) {
    return `${best.label} est ton axe qui progresse le plus : ${percentText(best.gain)} depuis le départ.`;
  }

  if (snapshot.indices.regularity >= 85) {
    return "Ta régularité est ton gros point fort en ce moment. Continue à protéger les jours légers.";
  }

  return "Progression homogène : laisse l’adaptation automatique faire évoluer les objectifs progressivement.";
}

export function createProgressView({ state, exercises }) {
  function renderBeforeAfter(snapshot) {
    const rows = snapshot.beforeAfter.slice(0, 4);

    $("#progressSinceStart").innerHTML = rows.length
      ? rows
          .map(
            (item) => `
          <div class="before-after-card">
            <small>${item.exercise.name}</small>
            <div>
              <span>${formatExerciseValue(item.exercise, item.first)}</span>
              <b>→</b>
              <strong>${formatExerciseValue(item.exercise, item.current)}</strong>
            </div>
            <em>${percentText(item.gainPercent)}</em>
          </div>`,
          )
          .join("")
      : `<div class="empty-state">Il faut quelques repères pour comparer le départ à aujourd’hui.</div>`;
  }

  function renderTargets() {
    $("#targets").innerHTML = TARGET_EXERCISE_IDS.map((id) => {
      const exercise = exercises[id];
      if (!exercise) return "";

      const target = Number(state.targets[id]) || exercise.base;
      const best = Number(state.bests[id]) || 0;

      return `
        <div class="adaptive-target">
          <div><strong>${exercise.name}</strong><small>${exercise.primary}</small></div>
          <div><b>${formatExerciseValue(exercise, target)}</b><span>objectif</span></div>
          <div><b>${best ? formatExerciseValue(exercise, best) : "—"}</b><span>record</span></div>
        </div>`;
    }).join("");
  }

  function renderBody(snapshot) {
    const body = snapshot.body;

    $("#bodySummary").innerHTML = `
      <div><strong>${body.currentWeight ?? "—"}</strong><span>kg actuel</span></div>
      <div><strong>${body.currentWaist ?? "—"}</strong><span>cm taille</span></div>`;

    const weights = state.measurements
      .filter((m) => Number(m.weightKg))
      .slice(-24);

    if (!weights.length) {
      $("#weightChart").innerHTML =
        `<span class="muted" style="font-size:11px">Ajoute quelques mesures pour voir la courbe.</span>`;
      return;
    }

    const values = weights.map((m) => Number(m.weightKg));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(0.5, max - min);

    $("#weightChart").innerHTML = weights
      .map((m) => {
        const height = 18 + ((Number(m.weightKg) - min) / range) * 62;
        return `<div class="bar" style="height:${height}px" title="${m.weightKg} kg"></div>`;
      })
      .join("");
  }

  function renderHistory() {
    const records = state.history.slice(0, 24);

    $("#history").innerHTML = records.length
      ? records
          .map(
            (record) => `
          <div class="history-item rich">
            <div>
              <strong>${record.sessionName || "Séance"}</strong>
              <small>${new Date(record.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</small>
            </div>
            <div>
              <b>${record.score}/100</b>
              <small>${Math.round((record.duration || 0) / 60)} min · +${record.xp} XP</small>
            </div>
          </div>`,
          )
          .join("")
      : `<span class="muted">Aucune séance.</span>`;
  }

  function render(snapshot) {
    $("#sessions").textContent = state.sessions;
    $("#xp").textContent = state.xp.toLocaleString("fr-FR");
    $("#streak").textContent = state.streak;
    $("#totalReps").textContent =
      snapshot.totals.repetitions.toLocaleString("fr-FR");
    $("#totalMinutes").textContent = snapshot.totals.minutes;
    $("#avgScore").textContent = snapshot.totals.averageScore || "—";

    $("#progressNarrative").textContent = progressionNarrative(
      snapshot,
      state.sessions,
    );
    $("#progressAxes").innerHTML = renderAxes(snapshot);

    renderBeforeAfter(snapshot);
    renderTargets();
    renderBody(snapshot);
    renderHistory();
  }

  return { render };
}
