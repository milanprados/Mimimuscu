import assert from "node:assert/strict";
import { resetProgression } from "../js/core/state.js";

const customSessions = [{ id: "perso", name: "Ma séance", exercises: [] }];
const measurements = [{ date: "2026-08-01", weightKg: 70 }];
const preferences = { autoSuggest: false };

const state = {
  program: { level: "adaptive", index: 17 },
  profile: { age: "28", heightCm: "178", weightKg: "70" },
  profileMeta: { nickname: "Milan", startedAt: "2026-01-01" },
  targets: { pushups: 19 },
  bests: { pushups: 24 },
  progressBaseline: { createdAt: "2026-01-01", values: { pushups: 10 } },
  sessions: 42,
  attempts: 44,
  xp: 1800,
  streak: 5,
  lastDay: "2026-08-10",
  history: [{ day: "2026-08-10", counted: true }],
  customSessions,
  preferences,
  measurements,
  goals: [{ id: "goal" }],
  achievements: { first: true },
  benchmark: { lastDate: "2026-08-01", dueEveryDays: 30 },
  calendarPrefs: { restDay: 0 },
};

const exercises = {
  pushups: { base: 10 },
  squat: { base: 14 },
};

resetProgression(state, exercises);

assert.equal(state.program.index, 0);
assert.deepEqual(state.targets, { pushups: 10, squat: 14 });
assert.deepEqual(state.bests, {});
assert.deepEqual(state.history, []);
assert.equal(state.sessions, 0);
assert.equal(state.attempts, 0);
assert.equal(state.xp, 0);
assert.equal(state.streak, 0);
assert.equal(state.lastDay, "");
assert.deepEqual(state.goals, []);
assert.deepEqual(state.achievements, {});
assert.equal(state.profileMeta.startedAt, "");
assert.equal(state.benchmark.lastDate, "");
assert.equal(state.benchmark.dueEveryDays, 30);

// Données personnelles / configuration préservées.
assert.equal(state.profileMeta.nickname, "Milan");
assert.strictEqual(state.customSessions, customSessions);
assert.strictEqual(state.measurements, measurements);
assert.strictEqual(state.preferences, preferences);
assert.deepEqual(state.calendarPrefs, { restDay: 0 });

console.log(
  "OK — reset progression : sportif à zéro, données personnelles conservées.",
);
