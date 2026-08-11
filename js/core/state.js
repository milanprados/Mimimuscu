/**
 * État persistant.
 * Ce module est le seul endroit qui connaît les clés localStorage.
 */
import {STORAGE, PROGRAM, PROGRESSION} from "../config.js";
import {migrateState, CURRENT_STATE_VERSION} from "./migrations.js";

const DEFAULT_STATE = {
  version: CURRENT_STATE_VERSION,
  program: {level: "adaptive", index: 0},

  profile: {age: "", heightCm: "", weightKg: ""},
  profileMeta: {nickname: "", startedAt: ""},

  targets: {},
  bests: {},
  progressBaseline: {createdAt: "", values: {}},

  sessions: 0,
  attempts: 0,
  xp: 0,
  streak: 0,
  lastDay: "",

  history: [],
  sessionDraft: null,
  customSessions: [],

  preferences: {autoSuggest: true},
  measurements: [],
  goals: [],

  calendarPrefs: {restDay: PROGRAM.defaultRestDay},

  benchmark: {lastDate: "", dueEveryDays: 28},
  achievements: {},
  backupMeta: {lastExportAt: ""}
};

function readStoredState() {
  for (const key of [STORAGE.currentKey, ...STORAGE.legacyKeys]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.warn(`[Mimi Muscu] Lecture impossible pour ${key}`, error);
    }
  }
  return null;
}

function normalizeCustomSessions(sessions) {
  return (Array.isArray(sessions) ? sessions : []).map((session, index) => {
    const normalized = {
      ...session,
      id: session.id || `legacy-${index}-${Date.now()}`,
      type: "custom",
      name: session.name || "Séance personnalisée",
      description: session.description || ""
    };

    if (!Array.isArray(normalized.exercises)) {
      normalized.exercises = [];

      // Conversion des très anciennes séances basées uniquement sur blocks[].
      for (const block of Array.isArray(normalized.blocks) ? normalized.blocks : []) {
        if (block?.type !== "exercise" || !block.exercise_id) continue;

        const sets = Math.max(1, Number(block.sets) || 1);

        for (let set = 0; set < sets; set++) {
          normalized.exercises.push({
            kind: "exercise",
            id: block.exercise_id,
            restAfter: Number(block.rest_after_sec) || 0,
            targetOverride: block.target_override ?? null,
            tempo: block.tempo || null,
            note: block.note || "",
            phase: "Personnalisé"
          });
        }
      }
    }

    normalized.exercises = normalized.exercises
      .filter(item => item?.id)
      .map(item => ({kind: "exercise", ...item}));

    return normalized;
  });
}

function normalizeState(raw, exercises) {
  const state = migrateState({
    ...structuredClone(DEFAULT_STATE),
    ...(raw || {})
  });

  state.program = {...DEFAULT_STATE.program, ...(state.program || {})};
  state.program.level = "adaptive";
  state.program.index = Math.max(0, Number(state.program.index) || 0);

  state.profile = {...DEFAULT_STATE.profile, ...(state.profile || {})};
  state.profileMeta = {...DEFAULT_STATE.profileMeta, ...(state.profileMeta || {})};

  state.targets = state.targets || {};
  state.bests = state.bests || {};
  state.progressBaseline = {
    ...DEFAULT_STATE.progressBaseline,
    ...(state.progressBaseline || {}),
    values: {...(state.progressBaseline?.values || {})}
  };

  state.history = Array.isArray(state.history)
    ? state.history.slice(0, PROGRESSION.historyLimit)
    : [];

  state.customSessions = normalizeCustomSessions(state.customSessions);
  state.sessionDraft = state.sessionDraft || null;

  state.preferences = {...DEFAULT_STATE.preferences, ...(state.preferences || {})};
  state.measurements = Array.isArray(state.measurements) ? state.measurements : [];
  state.goals = Array.isArray(state.goals) ? state.goals : [];

  state.calendarPrefs = {...DEFAULT_STATE.calendarPrefs, ...(state.calendarPrefs || {})};
  state.calendarPrefs.restDay = Math.max(
    0,
    Math.min(6, Number(state.calendarPrefs.restDay) || PROGRAM.defaultRestDay)
  );

  state.benchmark = {...DEFAULT_STATE.benchmark, ...(state.benchmark || {})};
  state.achievements = state.achievements || {};
  state.backupMeta = {...DEFAULT_STATE.backupMeta, ...(state.backupMeta || {})};

  for (const [id, exercise] of Object.entries(exercises)) {
    if (state.targets[id] == null) {
      state.targets[id] = state.targets[exercise.name] ?? exercise.base;
    }
  }

  return state;
}

export function loadState(exercises) {
  const state = normalizeState(readStoredState(), exercises);
  saveState(state);
  return state;
}

export function saveState(state) {
  localStorage.setItem(STORAGE.currentKey, JSON.stringify(state));
}

export function replaceState(state) {
  localStorage.setItem(STORAGE.currentKey, JSON.stringify(migrateState(state)));
}

export function clearLegacyStorage() {
  for (const key of STORAGE.legacyKeys) localStorage.removeItem(key);
}
