/**
 * Interface plein écran d'une séance.
 * Toute logique métier reste dans WorkoutEngine.
 */
import {
  $,
  $$,
  wait,
  openLayer,
  closeLayer,
  formatDuration,
  on,
  escapeHtml,
} from "../utils/dom.js";
import { preloadExercise } from "../utils/preload.js";
import { UI } from "../config.js";
import { getMuscleLoad, levelFromXp } from "../core/progression.js";

export function createWorkoutView({ state, exercises, caloriesForSeconds }) {
  let engine = null;
  let audioEnabled = true;
  let audioContext = null;
  let reportedReps = 0;
  let reportedEffort = "good";
  let resumeTimerAfterGuide = false;

  const audioIcon = (enabled) => `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="speaker" d="M6.5 10.2H9.5L13.5 7V17L9.5 13.8H6.5Z"/>
      ${
        enabled
          ? `<path class="wave" d="M16 9.2C16.8 10 17.2 10.9 17.2 12C17.2 13.1 16.8 14 16 14.8"/>`
          : `<path class="muted-wave" d="M16 9L20 15M20 9L16 15"/>`
      }
    </svg>`;

  function renderAudioControl() {
    const button = $("#audio");
    if (!button) return;
    button.innerHTML = audioIcon(audioEnabled);
    button.setAttribute(
      "aria-label",
      audioEnabled ? "Couper le son" : "Activer le son",
    );
    button.setAttribute("aria-pressed", String(audioEnabled));
  }

  function setEngine(value) {
    engine = value;
  }

  function getAudioContext() {
    if (!audioContext) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) audioContext = new Context();
    }
    return audioContext;
  }

  function speak(text) {
    if (!audioEnabled || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.04;
    speechSynthesis.speak(utterance);
  }

  function tone(frequency = 700) {
    if (!audioEnabled) return;

    try {
      const context = getAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.04;
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
    } catch {}
  }

  function open() {
    openLayer("#focus");
  }

  function close() {
    closeWorkoutGuide({ resume: false });
    engine?.cancel();
    $("#focus")?.classList.remove("rest-editorial", "active-editorial");
    closeLayer("#focus");
  }

  function renderGuideSteps(items = []) {
    return (items || [])
      .map(
        (text, index) => `
      <li><span>${index + 1}</span><p>${escapeHtml(text)}</p></li>`,
      )
      .join("");
  }

  function closeWorkoutGuide({ resume = true } = {}) {
    const overlay = $("#workoutGuideOverlay");
    if (!overlay || overlay.classList.contains("hidden")) return;

    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");

    const shouldResume = resume && resumeTimerAfterGuide;
    resumeTimerAfterGuide = false;
    if (shouldResume) engine?.resumeAfterGuide();
  }

  function openWorkoutGuide(exercise) {
    if (!exercise) return;

    resumeTimerAfterGuide = Boolean(engine?.pauseForGuide());

    const guide = exercise.guide || {};
    $("#workoutGuideTitle").textContent = exercise.name;
    $("#workoutGuideResume").textContent = resumeTimerAfterGuide
      ? engine.currentItem?.kind === "rest"
        ? "Reprendre le repos"
        : "Reprendre"
      : "Retour à l’exercice";

    const images = Array.isArray(exercise.images)
      ? exercise.images.filter(Boolean)
      : [];
    const imageBlock = images.length
      ? `
      <div class="workout-guide-images">
        ${images
          .slice(0, 2)
          .map(
            (src, index) => `
          <figure><span>${index === 0 ? "Départ" : "Fin"}</span><img src="${src}" alt=""></figure>`,
          )
          .join("")}
      </div>`
      : "";

    $("#workoutGuideBody").innerHTML = `
      ${imageBlock}
      ${exercise.description ? `<p class="workout-guide-description">${escapeHtml(exercise.description)}</p>` : ""}

      ${
        (guide.setup || []).length
          ? `
        <section class="workout-guide-section">
          <small>POSITION DE DÉPART</small>
          <ol>${renderGuideSteps(guide.setup)}</ol>
        </section>`
          : ""
      }

      ${
        (guide.execution || []).length
          ? `
        <section class="workout-guide-section">
          <small>MOUVEMENT</small>
          <ol>${renderGuideSteps(guide.execution)}</ol>
        </section>`
          : ""
      }

      ${
        guide.specific_note
          ? `
        <section class="workout-guide-section compact">
          <small>POINT CLÉ</small>
          <p>${escapeHtml(guide.specific_note)}</p>
        </section>`
          : ""
      }

      ${
        guide.breathing || exercise.breathing
          ? `
        <section class="workout-guide-section compact">
          <small>RESPIRATION</small>
          <p>${escapeHtml(guide.breathing || exercise.breathing)}</p>
        </section>`
          : ""
      }

      ${
        (guide.tips || exercise.tips || []).length
          ? `
        <section class="workout-guide-section compact">
          <small>À RETENIR</small>
          <ul>${(guide.tips || exercise.tips || [])
            .slice(0, 3)
            .map((text) => `<li>${escapeHtml(text)}</li>`)
            .join("")}</ul>
        </section>`
          : ""
      }

      ${
        (guide.errors || []).length
          ? `
        <section class="workout-guide-section compact danger">
          <small>À ÉVITER</small>
          <ul>${guide.errors
            .slice(0, 3)
            .map((text) => `<li>${escapeHtml(text)}</li>`)
            .join("")}</ul>
        </section>`
          : ""
      }
    `;

    const overlay = $("#workoutGuideOverlay");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    $("#workoutGuideBody").scrollTop = 0;
  }

  function renderHeader(item) {
    const focus = $("#focus");
    focus?.classList.toggle("rest-editorial", item?.kind === "rest");
    focus?.classList.remove("active-editorial");
    $("#focusPhase").textContent = item?.phase || "";
    $("#focusStep").textContent =
      `${engine.currentIndex + 1} / ${engine.planItems.length}`;

    $("#focusXp").textContent = `LV ${levelFromXp(state.xp)} • ${state.xp} XP`;

    const bar = document.querySelector(".focus-progress span");
    if (bar) {
      const progress =
        ((engine.currentIndex + 1) / Math.max(1, engine.planItems.length)) *
        100;
      bar.style.width = `${Math.max(2, Math.min(100, progress))}%`;
    }
  }

  function poseImages() {
    return `
      <div class="pose-grid placeholder-poses" aria-label="Illustrations à venir">
        <figure class="pose placeholder-pose"><figcaption>Départ</figcaption><div class="pose-placeholder"><span>◌</span><small>Illustration à venir</small></div></figure>
        <figure class="pose placeholder-pose"><figcaption>Fin</figcaption><div class="pose-placeholder"><span>◌</span><small>Illustration à venir</small></div></figure>
      </div>`;
  }

  function renderQuickCue(exercise, buttonId) {
    const guide = exercise?.guide || {};
    const cue =
      guide.specific_note ||
      guide.execution?.[0] ||
      guide.setup?.[0] ||
      exercise?.tips?.[0] ||
      "Mouvement lent et contrôlé.";
    return `
      <div class="quick-cue">
        <span class="quick-cue-icon">❧</span>
        <p>${escapeHtml(cue)}</p>
        <button class="technique-link" id="${buttonId}">Guide</button>
      </div>`;
  }

  function renderRestPrep(exercise) {
    if (!exercise) return "";
    const guide = exercise.guide || {};
    const setup = (guide.setup || []).slice(0, 3);
    const execution = (guide.execution || []).slice(0, 4);
    const breathing = guide.breathing || exercise.breathing || "";
    const bulletList = (items) =>
      items.length
        ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
    return `
      <div class="rest-prep">
        ${setup.length ? `<section><small>POSITION</small>${bulletList(setup)}</section>` : ""}
        ${execution.length ? `<section><small>MOUVEMENT</small>${bulletList(execution)}</section>` : ""}
        ${breathing ? `<section><small>RESPIRATION</small><ul><li>${escapeHtml(breathing)}</li></ul></section>` : ""}
      </div>`;
  }

  function renderRepetitionExercise({ item, exercise, target, next }) {
    if (next?.id) preloadExercise(exercises[next.id]);

    renderHeader(item);

    reportedReps = target;
    reportedEffort = "good";

    $("#focusContent").innerHTML = `
      <div class="workout-screen">
        <div class="workout-title">
          <span>${item.phase || "Exercice"}</span>
          <h2>${escapeHtml(exercise.name)}</h2>
          <div class="target-pill">
            <strong>${target}</strong>
            <small>${exercise.perSide ? " / côté" : " reps"}</small>
          </div>
        </div>

        ${poseImages()}

        ${renderQuickCue(exercise, "repGuide")}

        <div class="workout-controls">
          <div class="rep-row">
            <button id="minus" aria-label="Retirer une répétition">−</button>
            <div><strong id="repVal">${target}</strong><small>réalisées</small></div>
            <button id="plus" aria-label="Ajouter une répétition">+</button>
          </div>

          <div class="effort-label">Comment c’était ?</div>

          <div class="effort">
            <button data-effort="easy">Facile</button>
            <button data-effort="good" class="sel">Propre</button>
            <button data-effort="hard">Dur</button>
          </div>

          <button class="primary-btn workout-done" id="done">Terminé</button>

          <div class="workout-secondary">
            <button id="skip">Passer</button>
            <span>${next ? `Après : ${exercises[next.id]?.name || "exercice suivant"}` : "Dernier exercice"}</span>
          </div>
        </div>
      </div>`;

    on("#minus", "click", () => {
      reportedReps = Math.max(0, reportedReps - 1);
      $("#repVal").textContent = reportedReps;
    });

    on("#plus", "click", () => {
      reportedReps++;
      $("#repVal").textContent = reportedReps;
    });

    $$("[data-effort]").forEach((button) => {
      button.addEventListener("click", () => {
        reportedEffort = button.dataset.effort;
        $$("[data-effort]").forEach((candidate) =>
          candidate.classList.toggle("sel", candidate === button),
        );
      });
    });

    on("#done", "click", () =>
      engine.completeRepetitionExercise(reportedReps, reportedEffort),
    );

    on("#repGuide", "click", () => openWorkoutGuide(exercise));
    on("#skip", "click", () => engine.skipCurrentExercise());
  }

  function renderTimedExercise({ item, exercise, target }) {
    renderHeader(item);

    $("#focus")?.classList.add("active-editorial");

    const heroImage = exercise.thumb || exercise.images?.[0] || "";
    const description =
      item.note ||
      exercise.description ||
      exercise.tips?.[0] ||
      "Mouvement propre et contrôlé.";

    $("#focusContent").innerHTML = `
      <div class="workout-screen timed active-editorial-screen" id="activeExerciseScreen">
        <div class="active-exercise-hero ${heroImage ? "" : "placeholder"}" aria-hidden="true">
          ${heroImage ? `<img src="${heroImage}" alt="">` : ""}
        </div>

        <section class="active-exercise-heading">
          <span>${escapeHtml(item.phase || "Exercice")}</span>
          <h2>${escapeHtml(exercise.name)}</h2>
          <p>${escapeHtml(description)}</p>
          <button id="timerGuide">Guide complet →</button>
        </section>

        <div class="active-exercise-timer" id="timerVisual" aria-live="polite">
          <strong id="time">${target}</strong>
          <div class="active-exercise-timer-pulse" aria-hidden="true"></div>
        </div>

        <div class="active-exercise-actions">
          <div>
            <button class="primary-btn" id="pause">Pause</button>
            <button class="soft-btn" id="early">Terminer maintenant</button>
          </div>
          <button class="text-danger" id="skipTimed">Passer l’exercice</button>
        </div>
      </div>`;

    on("#pause", "click", () => engine.togglePause());
    on("#timerGuide", "click", () => openWorkoutGuide(exercise));
    on("#early", "click", () => engine.completeCurrentExercise(true));
    on("#skipTimed", "click", () => engine.skipCurrentExercise());
  }

  function renderRest({ seconds, next, nextExercise }) {
    if (nextExercise) preloadExercise(nextExercise);

    renderHeader(engine.currentItem);

    const nextMode = next?.modeOverride || nextExercise?.mode;
    const nextTarget =
      next && nextExercise ? engine.getTarget(next.id, next) : null;
    const nextTargetText = nextExercise
      ? `${nextTarget}${nextMode === "time" ? " sec" : nextExercise.perSide ? " / côté" : " reps"}`
      : "";
    const nextCue = next?.note || nextExercise?.tips?.[0] || "";
    const nextImage = nextExercise?.thumb || nextExercise?.images?.[0] || "";

    $("#focusContent").innerHTML = `
      <div class="recovery-screen editorial-rest" id="recoveryScreen">
        <div class="rest-editorial-hero ${nextImage ? "" : "placeholder"}">
          ${nextImage ? `<img src="${nextImage}" alt="">` : ""}
        </div>

        <section class="rest-editorial-next">
          <div class="rest-editorial-next-row">
            <div class="recovery-orbit" id="recoveryOrbit">
              <svg class="recovery-digit-svg" viewBox="0 0 100 100" aria-hidden="true">
                <text id="rest" x="50" y="50" text-anchor="middle" dominant-baseline="central">${seconds}</text>
              </svg>
              <div class="recovery-orbit-pulse" aria-hidden="true"></div>
            </div>

            <div class="rest-editorial-next-copy">
              <div class="rest-editorial-kicker">PROCHAIN EXERCICE</div>
              <h3>${escapeHtml(nextExercise?.name || "Fin de séance")}</h3>
              ${nextTargetText ? `<strong>${escapeHtml(nextTargetText)}</strong>` : ""}
              <p>${escapeHtml(nextCue || "Mouvement propre et contrôlé.")}</p>
            </div>
          </div>
        </section>

        ${
          nextExercise
            ? `
          <section class="rest-editorial-how">
            <div class="rest-editorial-how-head">COMMENT FAIRE</div>
            <div class="rest-editorial-how-scroll">
              ${renderRestPrep(nextExercise)}
              <div class="rest-editorial-guide-separator"></div>
              <button class="rest-editorial-guide" id="restGuide">Guide complet →</button>
            </div>
          </section>
        `
            : ""
        }

        <button class="soft-btn" id="skipRest">Passer le repos</button>
      </div>`;

    updateRestPresentation(seconds);
    speak(`Récupération. Prochain exercice ${nextExercise?.name || "fin"}`);

    if (nextExercise)
      on("#restGuide", "click", () => openWorkoutGuide(nextExercise));
    on("#skipRest", "click", () => engine.skipRest());
  }

  function updateRestPresentation(value) {
    const screen = $("#recoveryScreen");
    const orbit = $("#recoveryOrbit");

    if (!screen || !orbit) return;

    const total = Math.max(
      1,
      Number(engine?.currentItem?.seconds) || Number(value) || 1,
    );
    const remaining = Math.max(0, Number(value) || 0);
    const progress = Math.max(0, Math.min(1, remaining / total));
    orbit.style.setProperty("--rest-progress", `${progress * 100}%`);

    // Relance la pulse à chaque seconde sans toucher à la géométrie du cercle.
    orbit.classList.remove("tick-pulse");
    void orbit.offsetWidth;
    orbit.classList.add("tick-pulse");

    const preparing = remaining <= 3;
    screen.classList.toggle("preparing", preparing);

    if (preparing && remaining > 0) tone(remaining === 1 ? 920 : 680);
  }

  async function renderCountdown({ item, exercise, done }) {
    renderHeader(item);

    $("#focusContent").innerHTML = `
      <div class="count-screen">
        <span class="count-kicker">PRÊT POUR</span>
        <h2>${escapeHtml(exercise.name)}</h2>
        <div class="count-image placeholder-count"><div class="pose-placeholder"><span>◌</span><small>Illustration à venir</small></div></div>
        <div class="count-num" id="count">3</div>
      </div>`;

    speak(`Prochain exercice ${exercise.name}`);

    for (const number of [3, 2, 1]) {
      if (!$("#count")) return;
      $("#count").textContent = number;
      tone(number === 1 ? 920 : 680);
      await wait(UI.countdownStepMs);
    }

    done();
  }

  function renderFinished({ xp, score, records, duration, record }) {
    $("#focus")?.classList.remove("rest-editorial", "active-editorial");

    const calories = caloriesForSeconds(duration);
    const muscleLoad = getMuscleLoad(record);

    const topMuscles = Object.entries(muscleLoad)
      .sort((a, b) => b[1] - a[1])
      .filter(([, value]) => value > 0)
      .slice(0, 4);

    const maxLoad = Math.max(1, ...topMuscles.map(([, value]) => value));

    const muscleBars = topMuscles
      .map(([muscle, value]) => {
        const blocks = Math.max(1, Math.round((value / maxLoad) * 8));
        return `${muscle} ${"█".repeat(blocks)}${"░".repeat(8 - blocks)}`;
      })
      .join("<br>");

    const changedTargets = [];

    for (const set of record.sets || []) {
      if (set.skipped) continue;

      const nextTarget = state.targets[set.id];
      if (nextTarget && nextTarget !== set.target) {
        changedTargets.push(
          `${exercises[set.id].name}: ${set.target} → ${nextTarget}`,
        );
      }
    }

    $("#focusContent").innerHTML = `
      <div class="reward">
        <div class="muted">SÉANCE TERMINÉE</div>
        <div class="xp">+${xp} XP</div>

        <div class="reward-grid">
          <div><strong>${score}/100</strong><span>score</span></div>
          <div><strong>🔥 ${state.streak}</strong><span>streak</span></div>
          <div><strong>${formatDuration(duration)}</strong><span>durée</span></div>
          <div><strong>${calories ? `~${calories}` : "—"}</strong><span>kcal</span></div>
        </div>

        <div class="analysis-card"><h3>Charge musculaire</h3><p>${muscleBars || "Séance légère"}</p></div>

        <div class="analysis-card">
          <h3>Coach</h3>
          <p>${
            changedTargets.length
              ? `Progression appliquée : ${changedTargets.slice(0, 3).join(" • ")}.`
              : "Objectifs maintenus : continue à privilégier la technique."
          }</p>
          <p>${records.length ? `🏆 ${records.length} nouveau${records.length > 1 ? "x" : ""} record${records.length > 1 ? "s" : ""}.` : ""}</p>
        </div>

        <button class="primary-btn yellow-bg" id="finish">Terminer</button>
        <button class="ghost" id="askCoachAfter" style="margin-top:8px;width:100%">Demander au coach</button>
      </div>`;

    on("#finish", "click", () => {
      close();
      window.dispatchEvent(
        new CustomEvent("mimi:refresh", { detail: { tab: "progress" } }),
      );
    });

    on("#askCoachAfter", "click", async () => {
      close();
      window.dispatchEvent(
        new CustomEvent("mimi:refresh", { detail: { tab: "profile" } }),
      );

      try {
        await navigator.clipboard.writeText($("#coachPrompt")?.value || "");
      } catch {}

      window.open("https://chatgpt.com/", "_blank");
    });
  }

  function bindStaticControls() {
    on("#exitFocus", "click", () => {
      if (confirm("Quitter la séance ?")) close();
    });

    on("#audio", "click", () => {
      audioEnabled = !audioEnabled;
      renderAudioControl();
    });

    on("#closeWorkoutGuide", "click", () => closeWorkoutGuide());
    on("#workoutGuideResume", "click", () => closeWorkoutGuide());
    renderAudioControl();
  }

  return {
    setEngine,
    open,
    close,
    bindStaticControls,
    hooks: {
      exercise: renderRepetitionExercise,
      timer: renderTimedExercise,
      rest: renderRest,
      countdown: renderCountdown,
      finished: renderFinished,
      tick(value) {
        if ($("#time")) {
          $("#time").textContent = value;
          const timer = $("#timerVisual");
          timer?.classList.toggle("ending", value <= 3);
          timer?.classList.remove("tick-pulse");
          if (timer) void timer.offsetWidth;
          timer?.classList.add("tick-pulse");
        }
        if ($("#rest")) {
          $("#rest").textContent = value;
          updateRestPresentation(value);
        }
      },
      paused(paused) {
        if ($("#pause"))
          $("#pause").textContent = paused ? "Reprendre" : "Pause";
        $("#activeExerciseScreen")?.classList.toggle("paused", paused);
      },
    },
  };
}
