import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Le catalogue navigateur utilise fetch(file://...). Pour ce test Node uniquement,
// on fournit un petit fetch local avant d'importer program.js.
globalThis.fetch = async (url) => {
  const text = await fs.readFile(fileURLToPath(url), "utf8");
  return {
    ok: true,
    async json() {
      return JSON.parse(text);
    },
  };
};

const {
  compileProgramBlocks,
  createWorkoutPlan,
  sessionToFile,
  validateImportedSession,
} = await import("../js/core/program.js");
const { WorkoutEngine } = await import("../js/core/workout-engine.js");
const { loadState } = await import("../js/core/state.js");

// 1) Entrées de séance bornées : pas de repos/rounds infinis ou absurdes.
const compiled = compileProgramBlocks([
  {
    type: "exercise",
    exercise_id: "pushups",
    sets: 999,
    rest_after_sec: 99999,
    target_scale: 99,
  },
]);
assert.equal(compiled.length, 20);
assert.equal(compiled[0].restAfter, 600);
assert.equal(compiled[0].targetScale, 5);

// 2) Le plan ignore proprement un exercice devenu inconnu au lieu de planter le runtime.
const safePlan = createWorkoutPlan([
  { id: "pushups", restAfter: 25 },
  { id: "__missing__", restAfter: 25 },
  { id: "squat", restAfter: 0 },
]);
assert.equal(safePlan.items.filter((x) => x.kind === "exercise").length, 2);
assert.equal(safePlan.items.filter((x) => x.kind === "rest").length, 1);

// 3) Export = état réellement édité, pas vieux blocks[] conservé en arrière-plan.
const exported = sessionToFile({
  name: "Test",
  blocks: [{ type: "exercise", exercise_id: "squat" }],
  exercises: [
    { id: "pushups", phase: "Personnalisé", restAfter: 30, targetOverride: 12 },
  ],
});
assert.equal(exported.version, 4);
assert.equal(exported.blocks[0].exercise_id, "pushups");
assert.equal(exported.blocks[0].rest_after_sec, 30);

assert.throws(
  () =>
    validateImportedSession({
      app: "mimi-muscu",
      type: "workout-session",
      name: "cassée",
      blocks: [{ type: "exercise", exercise_id: "__missing__" }],
    }),
  /Exercice inconnu/,
);

// 4) État local corrompu/ancien : normalisation sans crash ni IDs fantômes.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
store.set(
  "mimiMuscuV31",
  JSON.stringify({
    version: 31,
    program: { index: "Infinity" },
    sessions: "12",
    attempts: "13",
    xp: "900",
    streak: "4",
    targets: [],
    bests: [],
    customSessions: [
      {
        id: "x",
        name: "x",
        exercises: [{ id: "__missing__" }, { id: "pushups", restAfter: 9999 }],
      },
    ],
    sessionDraft: { templateKey: "W1D1", exercises: [{ id: "__missing__" }] },
  }),
);
const stateExercises = {
  pushups: { id: "pushups", name: "Pompes", base: 5, mode: "reps" },
  squat: { id: "squat", name: "Squat", base: 10, mode: "reps" },
};
const normalized = loadState(stateExercises);
assert.equal(normalized.program.index, 0);
assert.equal(normalized.sessions, 12);
assert.deepEqual(normalized.targets, { pushups: 5, squat: 10 });
assert.equal(normalized.customSessions[0].exercises.length, 1);
assert.equal(normalized.customSessions[0].exercises[0].restAfter, 600);
assert.equal(normalized.sessionDraft, null);

// 5) Une séance majoritairement passée ne valide ni journée ni programme.
const exercise = {
  id: "pushups",
  name: "Pompes",
  mode: "reps",
  base: 5,
  min: 1,
  max: 50,
  step: 1,
};
const partialState = {
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
const partialPlan = {
  items: Array.from({ length: 4 }, () => ({
    kind: "exercise",
    id: "pushups",
    phase: "Bloc principal",
    track: true,
    adaptive: true,
    targetOverride: 5,
  })),
  meta: { key: "PARTIAL", name: "Partial", type: "program" },
};
let finishedPayload;
const engine = new WorkoutEngine({
  state: partialState,
  exercises: { pushups: exercise },
  buildProgramPlan: () => partialPlan,
  buildSessionPlan: () => partialPlan,
  persist: () => {},
  now: () => new Date(2026, 7, 11, 12, 0, 0),
  hooks: {
    countdown: ({ done }) => done(),
    exercise: () => {},
    finished: (p) => {
      finishedPayload = p;
    },
  },
});
engine.start();
engine.completeRepetitionExercise(5, "good");
engine.skipCurrentExercise();
engine.skipCurrentExercise();
engine.skipCurrentExercise();
assert.equal(partialState.program.index, 0);
assert.equal(partialState.sessions, 0);
assert.equal(partialState.history[0].counted, false);
assert.equal(partialState.history[0].completionCoverage, 25);
assert.equal(partialState.history[0].score, 25);
assert.ok(finishedPayload.xp < 70);

// finish() est idempotent : pas de double historique sur double événement.
const before = partialState.history.length;
engine.finish();
assert.equal(partialState.history.length, before);

console.log(
  "OK — stabilité V31.4 : entrées bornées, état réparé, séances partielles, export, finish idempotent.",
);
