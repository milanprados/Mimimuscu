/**
 * Mimi Muscu — point d'entrée.
 *
 * app.js assemble les modules et coordonne le refresh.
 * La logique métier doit rester dans core/, le DOM dans ui/.
 */
import { APP_VERSION } from "./config.js";

import { EXERCISES, FAMILIES, PROGRAMS, MILESTONES } from "./core/catalog.js";
import {
  getProgramTemplate,
  createProgramSession,
  buildProgramPlan,
  buildSessionPlan,
  sessionToFile,
  validateImportedSession,
} from "./core/program.js";
import { loadState, saveState } from "./core/state.js";
import {
  ensureProgressBaseline,
  buildProgressionSnapshot,
  levelFromXp,
} from "./core/progression.js";
import { WorkoutEngine } from "./core/workout-engine.js";

import { $, on } from "./utils/dom.js";

import { createNavigation } from "./ui/navigation.js";
import { createWorkoutView } from "./ui/workout.js";
import { createExerciseLibrary } from "./ui/exercise-library.js";
import { createSessionPlanner } from "./ui/session-planner.js";
import { createHomeView } from "./ui/home.js";
import { createCalendarView } from "./ui/calendar.js";
import { createProfileView } from "./ui/profile.js";
import { createProgressView } from "./ui/progress.js";

window.__MIMI_BOOT__ = {
  version: APP_VERSION,
  step: "data-loaded",
  errors: [],
};

const state = loadState(EXERCISES);
window.__MIMI_BOOT__.step = "state-loaded";

function caloriesForSeconds(seconds) {
  const weightKg = Number(state.profile.weightKg);
  if (!weightKg) return null;

  // Approximation volontairement simple (~4.5 MET).
  return Math.round(((4.5 * 3.5 * weightKg) / 200) * (seconds / 60));
}

function coachText() {
  const template = getProgramTemplate(state.program);
  const last = state.history[0];

  const lines = [
    "Analyse ma progression et donne-moi des conseils courts, concrets et adaptés à mon objectif esthétique.",
    `Routine 20 min, semaine ${template.week}/4, jour ${template.day}/6 : ${template.name}.`,
    `Profil : ${state.profile.age || "?"} ans, ${state.profile.heightCm || "?"} cm, ${state.profile.weightKg || "?"} kg.`,
    "Objectif : progression esthétique et musculaire au poids du corps, 6 séances par semaine.",
    `Streak : ${state.streak}. Niveau : ${levelFromXp(state.xp)}. XP : ${state.xp}.`,
  ];

  if (last) {
    lines.push(
      `Dernière séance : ${last.sessionName || "Séance"}, score ${last.score}/100, durée ${last.duration}s.`,
    );

    for (const set of last.sets || []) {
      lines.push(
        set.skipped
          ? `- ${set.name} : passé`
          : `- ${set.name} : ${set.actual}/${set.target} (${set.effort})`,
      );
    }
  }

  const latestMeasurement = state.measurements.at(-1);

  if (latestMeasurement) {
    lines.push(
      `Dernière mesure : ${latestMeasurement.weightKg || "?"} kg, tour de taille ${latestMeasurement.waistCm || "?"} cm.`,
    );
  }

  return lines.join("\n");
}

// Workout ---------------------------------------------------------------------
window.__MIMI_BOOT__.step = "workout-init";

const workoutView = createWorkoutView({
  state,
  exercises: EXERCISES,
  caloriesForSeconds,
});

const workoutEngine = new WorkoutEngine({
  state,
  exercises: EXERCISES,
  buildProgramPlan,
  buildSessionPlan,
  hooks: workoutView.hooks,
  persist: saveState,
});

workoutView.setEngine(workoutEngine);
workoutView.bindStaticControls();

function launchSession(session, redo = false) {
  workoutView.open();
  workoutEngine.start({ session, redo });
}

function launchCurrentProgram(redo = false) {
  workoutView.open();
  workoutEngine.start({ redo });
}

// Refresh partagé -------------------------------------------------------------
let progressionSnapshot = null;
let refreshApp = () => {};

function getSnapshot() {
  if (!progressionSnapshot) {
    progressionSnapshot = buildProgressionSnapshot(state, EXERCISES);
  }
  return progressionSnapshot;
}

// UI --------------------------------------------------------------------------
window.__MIMI_BOOT__.step = "sessions-init";

const sessionPlanner = createSessionPlanner({
  state,
  save: saveState,
  EXERCISES,
  workoutTemplate: getProgramTemplate,
  programSession: createProgramSession,
  sessionToFile,
  validateImportedSession,
  launchSession,
  refresh: () => refreshApp(),
});

window.__MIMI_BOOT__.step = "home-init";

const homeView = createHomeView({
  state,
  milestones: MILESTONES,
  getProgramTemplate,
  createProgramSession,
  launchSession,
  openPlanner: sessionPlanner.openPlanner,
});

window.__MIMI_BOOT__.step = "calendar-init";

const calendarView = createCalendarView({
  state,
  save: saveState,
  PROGRAMS,
  programSession: createProgramSession,
  launchSession,
});

window.__MIMI_BOOT__.step = "library-init";
createExerciseLibrary({ EXERCISES, FAMILIES });

window.__MIMI_BOOT__.step = "profile-init";

const profileView = createProfileView({
  state,
  exercises: EXERCISES,
  save: saveState,
  refresh: () => refreshApp(),
  getSnapshot,
  coachText,
});

const progressView = createProgressView({
  state,
  exercises: EXERCISES,
});

const navigation = createNavigation();

// Un seul chemin de rendu prévisible.
refreshApp = () => {
  if (ensureProgressBaseline(state, EXERCISES)) saveState(state);

  progressionSnapshot = buildProgressionSnapshot(state, EXERCISES);

  homeView.render();
  calendarView.render();
  sessionPlanner.renderCustomSessions();
  profileView.render(progressionSnapshot);
  progressView.render(progressionSnapshot);

  saveState(state);
};

on("#redoSession", "click", () => launchCurrentProgram(true));

window.addEventListener("mimi:refresh", (event) => {
  refreshApp();
  if (event.detail?.tab) navigation.showTab(event.detail.tab);
});

refreshApp();
window.__MIMI_BOOT__.step = "ready";

// PWA -------------------------------------------------------------------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .then((registration) => {
      // Vérifie sw.js à chaque démarrage, indépendamment du cache HTTP d'iOS.
      return registration.update();
    })
    .catch((error) => console.warn("[Mimi Muscu] Service worker", error));
}
