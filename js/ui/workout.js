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
    engine?.cancel();
    clearImageFlip();
    closeLayer("#focus");
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
    on("#early", "click", () => engine.completeCurrentExercise(true));
    on("#skipTimed", "click", () => engine.skipCurrentExercise());
  }

  function renderRest({seconds, next, nextExercise}) {
    if (nextExercise) preloadExercise(nextExercise);

    clearImageFlip();
    renderHeader(engine.currentItem);

    $("#focusContent").innerHTML = `
      <div class="recovery-screen">
        <div class="recovery-orbit"><strong id="rest">${seconds}</strong><small>sec</small></div>
        <div class="recovery-label">RÉCUPÈRE</div>

        ${nextExercise ? `
          <div class="next-card">
            <div class="next-copy">
              <small>Ensuite</small>
              <h3>${nextExercise.name}</h3>
              <strong>${engine.getTarget(next.id, next)}${
                nextExercise.mode === "time" ? " sec" : nextExercise.perSide ? " / côté" : " reps"
              }</strong>
            </div>
            <div class="next-visual"><img src="${nextExercise.thumb || nextExercise.images[0]}" alt=""></div>
          </div>
          <div class="recovery-tip">${nextExercise.tips?.[0] || ""}</div>
        ` : ""}

        <button class="soft-btn" id="skipRest">Passer le repos</button>
      </div>`;

    speak(`Récupération. Prochain exercice ${nextExercise?.name || "fin"}`);
    on("#skipRest", "click", () => engine.skipRest());
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
        if ($("#rest")) $("#rest").textContent = value;
      },
      paused(paused) {
        if ($("#pause")) $("#pause").textContent = paused ? "Reprendre" : "Pause";
      }
    }
  };
}
