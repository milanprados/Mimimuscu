import assert from "node:assert/strict";
import {WorkoutEngine} from "../js/core/workout-engine.js";

const exercises = {
  pushups: {
    id: "pushups", name: "Pompes", mode: "reps",
    base: 5, min: 1, max: 50, step: 1
  }
};

const state = {
  program: {level: "adaptive", index: 0},
  sessionDraft: null,
  targets: {pushups: 5},
  bests: {},
  sessions: 0,
  attempts: 0,
  xp: 0,
  streak: 0,
  lastDay: "",
  history: []
};

const sessionPlan = {
  items: [{
    kind: "exercise",
    id: "pushups",
    phase: "Bloc principal",
    restAfter: 0,
    track: true,
    adaptive: true,
    targetOverride: 5
  }],
  meta: {key: "TEST", name: "Test", type: "program"}
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
    countdown({done}) { done(); },
    exercise(payload) { exercisePayload = payload; },
    finished() {}
  }
});

engine.start();

assert.equal(engine.currentItem.kind, "exercise");
assert.equal(exercisePayload.exercise.id, "pushups");

engine.completeRepetitionExercise(6, "easy");

assert.equal(state.history.length, 1);
assert.equal(state.history[0].sets.length, 1, "La série doit être enregistrée.");
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
  program: {level: "adaptive", index: 0},
  sessionDraft: null,
  targets: {pushups: 5},
  bests: {},
  sessions: 0,
  attempts: 0,
  xp: 0,
  streak: 0,
  lastDay: "",
  history: [{
    date: "2026-08-10T09:00:00.000Z",
    day: "2026-08-10",
    counted: true,
    programCompleted: false,
    sessionType: "custom",
    sets: []
  }]
};

const secondEngine = new WorkoutEngine({
  state: secondState,
  exercises,
  buildProgramPlan: () => sessionPlan,
  buildSessionPlan: () => sessionPlan,
  persist: () => {},
  now: () => new Date(2026, 7, 10, 18, 0, 0),
  hooks: {
    countdown({done}) { done(); },
    exercise() {},
    finished() {}
  }
});

secondEngine.start();
secondEngine.completeRepetitionExercise(5, "good");

assert.equal(secondState.sessions, 0, "L'activité quotidienne était déjà comptée.");
assert.equal(secondState.program.index, 1, "La séance programme doit malgré tout avancer.");
assert.equal(secondState.history[0].programCompleted, true);
assert.equal(secondState.history[0].counted, false);

console.log("OK — séance perso puis programme le même jour.");
