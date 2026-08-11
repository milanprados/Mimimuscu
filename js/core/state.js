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

function normalizeCustomSessions(sessions, exercises) {
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
      .filter(item => item?.id && exercises?.[item.id])
      .map(item => ({
        kind: "exercise",
        ...item,
        restAfter: Math.max(0, Math.min(600, Number(item.restAfter) || 0))
      }));

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
  {
    const programIndex = Number(state.program.index);
    state.program.index = Number.isFinite(programIndex) ? Math.max(0, Math.floor(programIndex)) : 0;
  }

  state.profile = {...DEFAULT_STATE.profile, ...(state.profile || {})};
  state.profileMeta = {...DEFAULT_STATE.profileMeta, ...(state.profileMeta || {})};

  state.targets = state.targets && typeof state.targets === "object" && !Array.isArray(state.targets)
    ? state.targets
    : {};
  state.bests = state.bests && typeof state.bests === "object" && !Array.isArray(state.bests)
    ? state.bests
    : {};
  state.progressBaseline = {
    ...DEFAULT_STATE.progressBaseline,
    ...(state.progressBaseline || {}),
    values: {...(state.progressBaseline?.values || {})}
  };

  state.history = Array.isArray(state.history)
    ? state.history
        .filter(record => record && typeof record === "object")
        .map(record => ({
          ...record,
          sets: Array.isArray(record.sets) ? record.sets : []
        }))
        .slice(0, PROGRESSION.historyLimit)
    : [];

  state.customSessions = normalizeCustomSessions(state.customSessions, exercises);

  if (state.sessionDraft && Array.isArray(state.sessionDraft.exercises)) {
    state.sessionDraft = {
      ...state.sessionDraft,
      exercises: state.sessionDraft.exercises
        .filter(item => item?.id && exercises?.[item.id])
        .map(item => ({
          kind: "exercise",
          ...item,
          restAfter: Math.max(0, Math.min(600, Number(item.restAfter) || 0))
        }))
    };
    if (!state.sessionDraft.exercises.length) state.sessionDraft = null;
  } else {
    state.sessionDraft = null;
  }

  state.preferences = {
    ...DEFAULT_STATE.preferences,
    ...(state.preferences && typeof state.preferences === "object" ? state.preferences : {})
  };
  state.measurements = Array.isArray(state.measurements)
    ? state.measurements.filter(item => item && typeof item === "object")
    : [];
  state.goals = Array.isArray(state.goals)
    ? state.goals.filter(goal => goal && typeof goal === "object")
    : [];

  state.calendarPrefs = {...DEFAULT_STATE.calendarPrefs, ...(state.calendarPrefs && typeof state.calendarPrefs === "object" ? state.calendarPrefs : {})};
  state.calendarPrefs.restDay = Math.max(
    0,
    Math.min(6, Number(state.calendarPrefs.restDay) || PROGRAM.defaultRestDay)
  );

  state.benchmark = {...DEFAULT_STATE.benchmark, ...(state.benchmark && typeof state.benchmark === "object" ? state.benchmark : {})};
  state.achievements = state.achievements && typeof state.achievements === "object" && !Array.isArray(state.achievements) ? state.achievements : {};
  state.backupMeta = {...DEFAULT_STATE.backupMeta, ...(state.backupMeta && typeof state.backupMeta === "object" ? state.backupMeta : {})};

  // Les anciennes sauvegardes et les imports manuels peuvent contenir des nombres
  // sérialisés comme chaînes. On les remet dans un format stable avant le runtime.
  for (const key of ["sessions", "attempts", "xp", "streak"]) {
    const value = Number(state[key]);
    state[key] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }
  state.lastDay = typeof state.lastDay === "string" ? state.lastDay : "";

  for (const [id, exercise] of Object.entries(exercises)) {
    if (state.targets[id] == null) {
      state.targets[id] = state.targets[exercise.name] ?? exercise.base;
    }

    const target = Number(state.targets[id]);
    state.targets[id] = Number.isFinite(target) ? target : Number(exercise.base) || 1;

    if (state.bests[id] != null) {
      const best = Number(state.bests[id]);
      if (Number.isFinite(best) && best >= 0) state.bests[id] = best;
      else delete state.bests[id];
    }
  }

  return state;
}

/**
 * Remet uniquement la progression sportive à zéro.
 * Le profil, les mensurations, les préférences et les séances personnalisées sont conservés.
 */
export function resetProgression(state, exercises) {
  state.program = {...(state.program || {}), level: "adaptive", index: 0};

  state.targets = Object.fromEntries(
    Object.entries(exercises || {}).map(([id, exercise]) => [id, Number(exercise.base) || 1])
  );
  state.bests = {};
  state.progressBaseline = {createdAt: "", values: {}};

  state.sessions = 0;
  state.attempts = 0;
  state.xp = 0;
  state.streak = 0;
  state.lastDay = "";
  state.history = [];

  // Ces données dépendent directement de l'ancienne progression.
  state.goals = [];
  state.achievements = {};
  state.benchmark = {
    ...DEFAULT_STATE.benchmark,
    dueEveryDays: state.benchmark?.dueEveryDays || DEFAULT_STATE.benchmark.dueEveryDays
  };

  state.profileMeta = {...DEFAULT_STATE.profileMeta, ...(state.profileMeta || {}), startedAt: ""};
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
