/**
 * Interface plein écran d'une séance.
 * Toute logique métier reste dans WorkoutEngine.
 */
import {$, $$, wait, openLayer, closeLayer, formatDuration, on} from "../utils/dom.js";
import {preloadExercise} from "../utils/preload.js";
import {UI} from "../config.js";
import {getMuscleLoad, levelFromXp} from "../core/progression.js";

export function createWorkoutView({state, exercises, caloriesForSeconds}) {
  let engine = null;
  let audioEnabled = true;
  let imageFlipTimer = null;
  let audioContext = null;
  let reportedReps = 0;
  let reportedEffort = "good";
  let resumeTimerAfterGuide = false;

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
    } catch (_) {}
  }

  function clearImageFlip() {
    if (imageFlipTimer) clearInterval(imageFlipTimer);
    imageFlipTimer = null;
  }

  function open() {
    openLayer("#focus");
  }

  function close() {
    closeWorkoutGuide({resume: false});
    engine?.cancel();
    clearImageFlip();
    closeLayer("#focus");
  }

  function renderGuideSteps(items = []) {
    return (items || []).map((text, index) => `
      <li><span>${index + 1}</span><p>${text}</p></li>`
    ).join("");
  }

  function closeWorkoutGuide({resume = true} = {}) {
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
      ? (engine.currentItem?.kind === "rest" ? "Reprendre le repos" : "Reprendre")
      : "Retour à l’exercice";

    const images = Array.isArray(exercise.images) ? exercise.images.filter(Boolean) : [];
    const imageBlock = images.length ? `
      <div class="workout-guide-images">
        ${images.slice(0, 2).map((src, index) => `
          <figure><span>${index === 0 ? "Départ" : "Fin"}</span><img src="${src}" alt=""></figure>`
        ).join("")}
      </div>` : "";

    $("#workoutGuideBody").innerHTML = `
      ${imageBlock}
      ${exercise.description ? `<p class="workout-guide-description">${exercise.description}</p>` : ""}

      ${(guide.setup || []).length ? `
        <section class="workout-guide-section">
          <small>POSITION DE DÉPART</small>
          <ol>${renderGuideSteps(guide.setup)}</ol>
        </section>` : ""}

      ${(guide.execution || []).length ? `
        <section class="workout-guide-section">
          <small>MOUVEMENT</small>
          <ol>${renderGuideSteps(guide.execution)}</ol>
        </section>` : ""}

      ${(guide.tips || exercise.tips || []).length ? `
        <section class="workout-guide-section compact">
          <small>À RETENIR</small>
          <ul>${(guide.tips || exercise.tips || []).slice(0, 3).map(text => `<li>${text}</li>`).join("")}</ul>
        </section>` : ""}

      ${(guide.errors || []).length ? `
        <section class="workout-guide-section compact danger">
          <small>À ÉVITER</small>
          <ul>${guide.errors.slice(0, 3).map(text => `<li>${text}</li>`).join("")}</ul>
        </section>` : ""}
    `;

    const overlay = $("#workoutGuideOverlay");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    $("#workoutGuideBody").scrollTop = 0;
  }

  function renderHeader(item) {
    $("#focusPhase").textContent = item?.phase || "";
    $("#focusStep").textContent =
      `${engine.currentIndex + 1} / ${engine.planItems.length}`;

    $("#focusXp").textContent =
      `LV ${levelFromXp(state.xp)} • ${state.xp} XP`;

    const bar = document.querySelector(".focus-progress span");
    if (bar) {
      const progress = (engine.currentIndex + 1) / Math.max(1, engine.planItems.length) * 100;
      bar.style.width = `${Math.max(2, Math.min(100, progress))}%`;
    }
  }

  function poseImages(exercise) {
    return `
      <div class="pose-grid">
        <figure class="pose"><figcaption>Départ</figcaption><img src="${exercise.images[0]}" alt=""></figure>
        <figure class="pose"><figcaption>Fin</figcaption><img src="${exercise.images[1]}" alt=""></figure>
      </div>`;
  }

  function renderRepetitionExercise({item, exercise, target, next}) {
    if (next?.id) preloadExercise(exercises[next.id]);

    clearImageFlip();
    renderHeader(item);

    reportedReps = target;
    reportedEffort = "good";

    $("#focusContent").innerHTML = `
      <div class="workout-screen">
        <div class="workout-title">
          <span>${item.phase || "Exercice"}</span>
          <h2>${exercise.name}</h2>
          <div class="target-pill">
            <strong>${target}</strong>
            <small>${exercise.perSide ? " / côté" : " reps"}</small>
          </div>
        </div>

        ${poseImages(exercise)}

        <div class="cue-card">
          <span>CONSIGNE</span>
          <p>${exercise.tips?.[0] || "Mouvement propre et contrôlé."}</p>
          <button class="technique-link" id="repGuide">? Voir le guide</button>
        </div>

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

    $$("[data-effort]").forEach(button => {
      button.addEventListener("click", () => {
        reportedEffort = button.dataset.effort;
        $$("[data-effort]").forEach(candidate =>
          candidate.classList.toggle("sel", candidate === button)
        );
      });
    });

    on("#done", "click", () =>
      engine.completeRepetitionExercise(reportedReps, reportedEffort)
    );

    on("#repGuide", "click", () => openWorkoutGuide(exercise));
    on("#skip", "click", () => engine.skipCurrentExercise());
  }

  function renderTimedExercise({item, exercise, target}) {
    clearImageFlip();
    renderHeader(item);

    $("#focusContent").innerHTML = `
      <div class="workout-screen timed">
        <div class="workout-title">
          <span>${item.phase || "Exercice"}</span>
          <h2>${exercise.name}</h2>
        </div>

        <div class="timer-visual" id="timerVisual">
          <img class="start" src="${exercise.images[0]}" alt="">
          <img class="end" src="${exercise.images[1]}" alt="">
          <span class="timer-tag" id="timerPoseLabel">Départ</span>
          <div class="timer-overlay"><strong id="time">${target}</strong><small>sec</small></div>
        </div>

        <div class="cue-card">
          <span>CONSIGNE</span>
          <p>${exercise.tips?.[0] || "Mouvement contrôlé."}</p>
          <button class="technique-link" id="timerGuide">? Voir le guide</button>
        </div>

        <div class="timer-actions">
          <button class="primary-btn" id="pause">Pause</button>
          <button class="soft-btn" id="early">Terminer maintenant</button>
          <button class="text-danger" id="skipTimed">Passer l’exercice</button>
        </div>
      </div>`;

    let showEnd = false;

    imageFlipTimer = setInterval(() => {
      showEnd = !showEnd;
      $("#timerVisual")?.classList.toggle("swap", showEnd);
      if ($("#timerPoseLabel")) $("#timerPoseLabel").textContent = showEnd ? "Fin" : "Départ";
    }, UI.exerciseImageFlipMs);

    on("#pause", "click", () => engine.togglePause());
    on("#timerGuide", "click", () => openWorkoutGuide(exercise));
    on("#early", "click", () => engine.completeCurrentExercise(true));
    on("#skipTimed", "click", () => engine.skipCurrentExercise());
  }

  function renderRest({seconds, next, nextExercise}) {
    if (nextExercise) preloadExercise(nextExercise);

    clearImageFlip();
    renderHeader(engine.currentItem);

    const nextMode = next?.modeOverride || nextExercise?.mode;
    const nextTarget = next && nextExercise ? engine.getTarget(next.id, next) : null;
    const nextCue = next?.note || nextExercise?.tips?.[0] || "";
    const nextImage = nextExercise?.thumb || nextExercise?.images?.[0] || "";

    $("#focusContent").innerHTML = `
      <div class="recovery-screen" id="recoveryScreen">
        <div class="recovery-orbit"><strong id="rest">${seconds}</strong><small>sec</small></div>
        <div class="recovery-label" id="recoveryLabel">RÉCUPÈRE</div>

        ${nextExercise ? `
          <div class="next-card">
            <div class="next-copy">
              <small>PROCHAIN EXERCICE</small>
              <h3>${nextExercise.name}</h3>
              <strong>${nextTarget}${
                nextMode === "time" ? " sec" : nextExercise.perSide ? " / côté" : " reps"
              }</strong>
              ${nextCue ? `<p>${nextCue}</p>` : ""}
              <button class="technique-link" id="restGuide">? Voir le guide</button>
            </div>
            ${nextImage ? `<div class="next-visual"><img src="${nextImage}" alt=""></div>` : ""}
          </div>
        ` : ""}

        <div class="recovery-countdown-note" id="recoveryCountdownNote">Le 3–2–1 est inclus dans le repos.</div>
        <button class="soft-btn" id="skipRest">Passer le repos</button>
      </div>`;

    updateRestCountdown(seconds);
    speak(`Récupération. Prochain exercice ${nextExercise?.name || "fin"}`);
    on("#restGuide", "click", () => openWorkoutGuide(nextExercise), {required: false});
    on("#skipRest", "click", () => engine.skipRest());
  }

  function updateRestCountdown(value) {
    const rest = $("#rest");
    if (!rest) return;

    rest.textContent = value;
    const preparing = value > 0 && value <= 3;
    $("#recoveryScreen")?.classList.toggle("preparing", preparing);

    const label = $("#recoveryLabel");
    if (label) label.textContent = preparing ? "PRÊT" : "RÉCUPÈRE";

    const note = $("#recoveryCountdownNote");
    if (note) note.textContent = preparing
      ? `Départ dans ${value}…`
      : "Le 3–2–1 est inclus dans le repos.";

    if (preparing) tone(value === 1 ? 920 : 680);
  }

  async function renderCountdown({item, exercise, done}) {
    clearImageFlip();
    renderHeader(item);

    $("#focusContent").innerHTML = `
      <div class="count-screen">
        <span class="count-kicker">PRÊT POUR</span>
        <h2>${exercise.name}</h2>
        <img class="count-image" src="${exercise.thumb || exercise.images[0]}" alt="">
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

  function renderFinished({xp, score, records, duration, record}) {
    clearImageFlip();

    const calories = caloriesForSeconds(duration);
    const muscleLoad = getMuscleLoad(record);

    const topMuscles = Object.entries(muscleLoad)
      .sort((a, b) => b[1] - a[1])
      .filter(([, value]) => value > 0)
      .slice(0, 4);

    const maxLoad = Math.max(1, ...topMuscles.map(([, value]) => value));

    const muscleBars = topMuscles.map(([muscle, value]) => {
      const blocks = Math.max(1, Math.round(value / maxLoad * 8));
      return `${muscle} ${"█".repeat(blocks)}${"░".repeat(8 - blocks)}`;
    }).join("<br>");

    const changedTargets = [];

    for (const set of record.sets || []) {
      if (set.skipped) continue;

      const nextTarget = state.targets[set.id];
      if (nextTarget && nextTarget !== set.target) {
        changedTargets.push(`${exercises[set.id].name}: ${set.target} → ${nextTarget}`);
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
      window.dispatchEvent(new CustomEvent("mimi:refresh", {detail: {tab: "progress"}}));
    });

    on("#askCoachAfter", "click", async () => {
      close();
      window.dispatchEvent(new CustomEvent("mimi:refresh", {detail: {tab: "profile"}}));

      try {
        await navigator.clipboard.writeText($("#coachPrompt")?.value || "");
      } catch (_) {}

      window.open("https://chatgpt.com/", "_blank");
    });
  }

  function bindStaticControls() {
    on("#closeWorkoutGuide", "click", () => closeWorkoutGuide());
    on("#workoutGuideResume", "click", () => closeWorkoutGuide());

    on("#exitFocus", "click", () => {
      if (confirm("Quitter la séance ?")) close();
    });

    on("#audio", "click", () => {
      audioEnabled = !audioEnabled;
      $("#audio").textContent = audioEnabled ? "🔊" : "🔇";
    });
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
        if ($("#time")) $("#time").textContent = value;
        if ($("#rest")) updateRestCountdown(value);
      },
      paused(paused) {
        if ($("#pause")) $("#pause").textContent = paused ? "Reprendre" : "Pause";
      }
    }
  };
}
