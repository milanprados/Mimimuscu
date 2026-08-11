import assert from "node:assert/strict";
import { WorkoutEngine } from "../js/core/workout-engine.js";

const exercises = {
  pushups: {
    id: "pushups",
    name: "Pompes",
    mode: "reps",
    base: 5,
    min: 1,
    max: 50,
    step: 1,
  },
};

const state = {
  program: { level: "adaptive", index: 0 },
  sessionDraft: null,
  targets: { pushups: 5 },
  bests: {},
  sessions: 0,
  attempts: 0,
  xp: 0,
  streak: 0,
  lastDay: "",
  history: [],
};

const sessionPlan = {
  items: [
    {
      kind: "exercise",
      id: "pushups",
      phase: "Bloc principal",
      restAfter: 0,
      track: true,
      adaptive: true,
      targetOverride: 5,
    },
  ],
  meta: { key: "TEST", name: "Test", type: "program" },
};

let exercisePayload = null;
let saves = 0;

const engine = new WorkoutEngine({
  state,
  exercises,
  buildProgramPlan: () => sessionPlan,
  buildSessionPlan: () => sessionPlan,
  persist: () => saves++,
  now: () => new Date(2026, 7, 10, 12, 0, 0),
  hooks: {
    countdown({ done }) {
      done();
    },
    exercise(payload) {
      exercisePayload = payload;
    },
    finished() {},
  },
});

engine.start();

assert.equal(engine.currentItem.kind, "exercise");
assert.equal(exercisePayload.exercise.id, "pushups");

engine.completeRepetitionExercise(6, "easy");

assert.equal(state.history.length, 1);
assert.equal(
  state.history[0].sets.length,
  1,
  "La série doit être enregistrée.",
);
assert.equal(state.history[0].sets[0].actual, 6);
assert.equal(state.history[0].sessionType, "program");
assert.equal(state.history[0].day, "2026-08-10");
assert.equal(state.program.index, 1);
assert.equal(state.sessions, 1);
assert.equal(state.bests.pushups, 6);
assert.ok(saves > 0);

console.log("OK — moteur séance : log, PR, cycle, date locale.");

// Regression V31 : une séance perso ne doit pas empêcher la séance programme
// d'avancer le cycle le même jour.
const secondState = {
  program: { level: "adaptive", index: 0 },
  sessionDraft: null,
  targets: { pushups: 5 },
  bests: {},
  sessions: 0,
  attempts: 0,
  xp: 0,
  streak: 0,
  lastDay: "",
  history: [
    {
      date: "2026-08-10T09:00:00.000Z",
      day: "2026-08-10",
      counted: true,
      programCompleted: false,
      sessionType: "custom",
      sets: [],
    },
  ],
};

const secondEngine = new WorkoutEngine({
  state: secondState,
  exercises,
  buildProgramPlan: () => sessionPlan,
  buildSessionPlan: () => sessionPlan,
  persist: () => {},
  now: () => new Date(2026, 7, 10, 18, 0, 0),
  hooks: {
    countdown({ done }) {
      done();
    },
    exercise() {},
    finished() {},
  },
});

secondEngine.start();
secondEngine.completeRepetitionExercise(5, "good");

assert.equal(
  secondState.sessions,
  0,
  "L'activité quotidienne était déjà comptée.",
);
assert.equal(
  secondState.program.index,
  1,
  "La séance programme doit malgré tout avancer.",
);
assert.equal(secondState.history[0].programCompleted, true);
assert.equal(secondState.history[0].counted, false);

console.log("OK — séance perso puis programme le même jour.");

// Régression V31.1 : fin automatique d'un minuteur -> repos -> exercice suivant.
// Le 3-2-1 doit être inclus dans le repos, donc aucun second hook countdown.
const flowExercises = {
  hold: {
    id: "hold",
    name: "Planche",
    mode: "time",
    base: 2,
    min: 1,
    max: 60,
    step: 1,
  },
  squat: {
    id: "squat",
    name: "Squat",
    mode: "reps",
    base: 5,
    min: 1,
    max: 50,
    step: 1,
  },
};

const flowState = {
  program: { level: "adaptive", index: 0 },
  sessionDraft: null,
  targets: { hold: 2, squat: 5 },
  bests: {},
  sessions: 0,
  attempts: 0,
  xp: 0,
  streak: 0,
  lastDay: "",
  history: [],
};

const flowPlan = {
  items: [
    {
      kind: "exercise",
      id: "hold",
      phase: "Bloc principal",
      track: true,
      adaptive: true,
      targetOverride: 2,
    },
    { kind: "rest", seconds: 3, phase: "Repos" },
    {
      kind: "exercise",
      id: "squat",
      phase: "Bloc principal",
      track: true,
      adaptive: true,
      targetOverride: 5,
    },
  ],
  meta: { key: "FLOW", name: "Flow", type: "program" },
};

let countdownCalls = 0;
let restPayload = null;
let repetitionPayload = null;
let activeInterval = null;

const flowEngine = new WorkoutEngine({
  state: flowState,
  exercises: flowExercises,
  buildProgramPlan: () => flowPlan,
  buildSessionPlan: () => flowPlan,
  persist: () => {},
  now: () => new Date(2026, 7, 10, 20, 0, 0),
  hooks: {
    countdown({ done }) {
      countdownCalls++;
      done();
    },
    timer() {},
    rest(payload) {
      restPayload = payload;
    },
    exercise(payload) {
      repetitionPayload = payload;
    },
    tick() {},
    finished() {},
  },
});

// Faux setInterval déterministe : on déclenche les secondes à la main.
flowEngine.startTimerInterval = (callback) => {
  flowEngine.timerRunning = true;
  activeInterval = callback;
};
flowEngine.stopTimer = () => {
  flowEngine.timerRunning = false;
  activeInterval = null;
};
const flowTick = () => {
  const callback = activeInterval;
  assert.ok(callback, "Aucun minuteur actif à faire avancer.");
  callback();
};

flowEngine.start();
assert.equal(flowEngine.currentItem.id, "hold");
assert.equal(
  countdownCalls,
  1,
  "Le compte à rebours séparé ne doit exister qu'au lancement.",
);

flowTick();
flowTick();
assert.equal(
  flowEngine.currentItem.kind,
  "rest",
  "La fin du minuteur doit ouvrir automatiquement le repos.",
);
assert.equal(
  restPayload?.nextExercise?.id,
  "squat",
  "Le repos doit recevoir le prochain exercice sans erreur runtime.",
);

// Le guide peut mettre le repos en pause puis le reprendre au même temps restant.
const beforeGuide = flowEngine.remainingSeconds;
assert.equal(flowEngine.pauseForGuide(), true);
assert.equal(flowEngine.timerRunning, false);
flowEngine.resumeAfterGuide();
assert.equal(flowEngine.timerRunning, true);
assert.equal(flowEngine.remainingSeconds, beforeGuide);

flowTick();
flowTick();
flowTick();
assert.equal(
  flowEngine.currentItem.id,
  "squat",
  "À 0, l'exercice suivant doit démarrer automatiquement.",
);
assert.equal(repetitionPayload?.exercise?.id, "squat");
assert.equal(
  countdownCalls,
  1,
  "Pas de 3-2-1 ajouté après le repos : il est inclus dans ses dernières secondes.",
);

console.log(
  "OK — déroulement V31.1 : minuteurs auto, repos, countdown intégré, guide pause/reprise.",
);
