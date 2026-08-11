/**
 * Calculs de progression partagés par Profil, Progrès et écran de fin.
 * 100 = niveau personnel de départ, jamais un percentile populationnel.
 */
import { PROGRAM, PROGRESSION } from "../config.js";
import { localDayKey } from "../utils/dates.js";

export const PROGRESSION_AXES = {
  push: {
    label: "Push",
    ids: ["pushups", "pike"],
    hint: "Pecs · épaules · triceps",
  },
  legs: {
    label: "Jambes",
    ids: ["squat", "reverse_lunge"],
    hint: "Quadriceps · fessiers",
  },
  core: {
    label: "Core",
    ids: ["plank", "dead_bug"],
    hint: "Gainage · contrôle",
  },
  back: {
    label: "Dos",
    ids: ["superman_pull", "reverse_snow_angel"],
    hint: "Chaîne postérieure · posture",
  },
};

export const RECORD_EXERCISE_IDS = [
  "pushups",
  "plank",
  "squat",
  "reverse_lunge",
  "pike",
  "reverse_crunch",
  "superman_pull",
  "single_leg_glute_bridge",
];

export const TARGET_EXERCISE_IDS = [
  "pushups",
  "pike",
  "squat",
  "reverse_lunge",
  "plank",
  "dead_bug",
  "superman_pull",
  "reverse_snow_angel",
];

export const MUSCLE_GROUPS = [
  "Pecs",
  "Épaules",
  "Triceps",
  "Dos",
  "Jambes",
  "Fessiers",
  "Core",
];

export const EXERCISE_LOAD = {
  pushups: { Pecs: 3, Épaules: 1, Triceps: 2, Core: 1 },
  close_pushups: { Pecs: 1, Épaules: 1, Triceps: 3, Core: 1 },
  pike: { Pecs: 1, Épaules: 3, Triceps: 2, Core: 1 },
  squat: { Jambes: 3, Fessiers: 2, Core: 1 },
  slow_squat: { Jambes: 3, Fessiers: 2, Core: 1 },
  reverse_lunge: { Jambes: 3, Fessiers: 2, Core: 1 },
  split_squat: { Jambes: 3, Fessiers: 2, Core: 1 },
  glute_bridge: { Jambes: 1, Fessiers: 3, Core: 1 },
  single_leg_glute_bridge: { Jambes: 1, Fessiers: 3, Core: 1 },
  plank: { Core: 3, Épaules: 1, Fessiers: 1 },
  hollow_hold: { Core: 3 },
  bear_hold: { Core: 3, Épaules: 1, Jambes: 1 },
  dead_bug: { Core: 3 },
  reverse_crunch: { Core: 3 },
  reverse_snow_angel: { Dos: 3, Épaules: 2 },
  prone_ytw: { Dos: 3, Épaules: 2 },
  superman_pull: { Dos: 3, Épaules: 1 },
  side_plank_reach: { Core: 3, Épaules: 1 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundOne = (value) => Math.round(value * 10) / 10;

export function levelFromXp(xp) {
  return 1 + Math.floor((Number(xp) || 0) / PROGRESSION.xpPerLevel);
}

export function isProgramHistoryRecord(record) {
  if (!record) return false;
  if (record.sessionType === "program") return true;
  return /^W\d+D\d+$/i.test(String(record.sessionKey || ""));
}

function countedHistory(state) {
  return state.history.filter((record) => record.counted);
}

function firstActual(state, exerciseId) {
  for (const record of [...countedHistory(state)].reverse()) {
    const set = (record.sets || []).find(
      (item) =>
        item.id === exerciseId && !item.skipped && Number(item.actual) > 0,
    );
    if (set) return Number(set.actual);
  }
  return null;
}

function latestActual(state, exerciseId) {
  for (const record of state.history) {
    const set = (record.sets || []).find(
      (item) =>
        item.id === exerciseId && !item.skipped && Number(item.actual) > 0,
    );
    if (set) return Number(set.actual);
  }
  return null;
}

function currentPerformance(state, exercises, exerciseId) {
  const best = Number(state.bests[exerciseId]) || 0;
  if (best > 0) return best;

  const latest = latestActual(state, exerciseId);
  if (latest) return latest;

  return (
    Number(state.targets[exerciseId]) ||
    Number(exercises[exerciseId]?.base) ||
    1
  );
}

export function ensureProgressBaseline(state, exercises) {
  state.progressBaseline ||= { createdAt: "", values: {} };
  state.progressBaseline.values ||= {};

  const anchorIds = [
    ...new Set(Object.values(PROGRESSION_AXES).flatMap((axis) => axis.ids)),
  ];

  let changed = false;

  for (const id of anchorIds) {
    if (!(Number(state.progressBaseline.values[id]) > 0)) {
      state.progressBaseline.values[id] =
        firstActual(state, id) ||
        Number(state.targets[id]) ||
        Number(exercises[id]?.base) ||
        1;
      changed = true;
    }
  }

  if (!state.progressBaseline.createdAt) {
    const firstRecord = [...countedHistory(state)].reverse()[0];
    state.progressBaseline.createdAt =
      firstRecord?.date || new Date().toISOString();
    changed = true;
  }

  state.profileMeta ||= { nickname: "", startedAt: "" };

  if (!state.profileMeta.startedAt) {
    state.profileMeta.startedAt = state.progressBaseline.createdAt;
    changed = true;
  }

  return changed;
}

function axisIndex(state, exercises, axis) {
  const ratios = axis.ids
    .map((id) => {
      const baseline =
        Number(state.progressBaseline.values[id]) ||
        currentPerformance(state, exercises, id) ||
        1;
      return currentPerformance(state, exercises, id) / baseline;
    })
    .filter(Number.isFinite);

  if (!ratios.length) return PROGRESSION.baselineIndex;

  return Math.round(
    (ratios.reduce((sum, value) => sum + value, 0) / ratios.length) *
      PROGRESSION.baselineIndex,
  );
}

function buildIndices(state, exercises, now) {
  const axes = {};

  for (const [key, axis] of Object.entries(PROGRESSION_AXES)) {
    axes[key] = axisIndex(state, exercises, axis);
  }

  const physical = Math.round(
    Object.values(axes).reduce((sum, value) => sum + value, 0) /
      Object.values(axes).length,
  );

  const cutoff = now.getTime() - 28 * 86400000;
  const activeDays = new Set(
    countedHistory(state)
      .filter((record) => new Date(record.date).getTime() >= cutoff)
      .map((record) => record.day),
  ).size;

  return {
    ...axes,
    physical,
    regularity: Math.round(
      clamp((activeDays / PROGRAM.cycleLength) * 100, 0, 100),
    ),
  };
}

function buildTotals(state) {
  let repetitions = 0;
  let seconds = 0;

  for (const record of state.history) {
    seconds += Number(record.duration) || 0;

    for (const set of record.sets || []) {
      if (!set.skipped && set.mode === "reps") {
        repetitions += Number(set.actual) || 0;
      }
    }
  }

  const scored = countedHistory(state).filter((record) =>
    Number.isFinite(Number(record.score)),
  );

  return {
    repetitions,
    minutes: Math.round(seconds / 60),
    averageScore: scored.length
      ? Math.round(
          scored.reduce((sum, record) => sum + Number(record.score), 0) /
            scored.length,
        )
      : 0,
  };
}

export function getCycleInfo(state) {
  const completed = Math.max(0, Number(state.program.index) || 0);
  const position = completed % PROGRAM.cycleLength;

  return {
    completed,
    cycle: Math.floor(completed / PROGRAM.cycleLength) + 1,
    position,
    week: Math.floor(position / PROGRAM.sessionsPerWeek) + 1,
    day: (position % PROGRAM.sessionsPerWeek) + 1,
  };
}

function buildBodyData(state) {
  const measurements = state.measurements.filter((item) => item?.date);
  const first = measurements[0] || {};
  const latest = measurements.at(-1) || {};

  const currentWeight =
    Number(latest.weightKg) || Number(state.profile.weightKg) || null;
  const currentWaist = Number(latest.waistCm) || null;

  const firstWeight = Number(first.weightKg) || currentWeight;
  const firstWaist = Number(first.waistCm) || currentWaist;

  return {
    first,
    latest,
    currentWeight,
    currentWaist,
    weightDelta:
      currentWeight && firstWeight
        ? roundOne(currentWeight - firstWeight)
        : null,
    waistDelta:
      currentWaist && firstWaist ? roundOne(currentWaist - firstWaist) : null,
  };
}

function buildActivityDays(state, now) {
  const counts = new Map();

  for (const record of countedHistory(state)) {
    counts.set(record.day, (counts.get(record.day) || 0) + 1);
  }

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() + index - 41);
    const key = localDayKey(date);
    return { key, date, count: counts.get(key) || 0 };
  });
}

function buildBeforeAfter(state, exercises) {
  return RECORD_EXERCISE_IDS.map((id) => {
    const exercise = exercises[id];
    const first = firstActual(state, id);
    const current = Number(state.bests[id]) || latestActual(state, id);

    if (!exercise || !first || !current) return null;

    return {
      id,
      exercise,
      first,
      current,
      gainPercent: (current / first - 1) * 100,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.gainPercent - a.gainPercent);
}

function buildRecords(state, exercises) {
  return RECORD_EXERCISE_IDS.map((id) => ({
    id,
    exercise: exercises[id],
    best: Number(state.bests[id]) || 0,
    first: firstActual(state, id),
  }))
    .filter((item) => item.exercise && item.best > 0)
    .sort((a, b) => {
      const gainA = a.first ? a.best / a.first : 0;
      const gainB = b.first ? b.best / b.first : 0;
      return gainB - gainA;
    });
}

export function buildProgressionSnapshot(state, exercises, now = new Date()) {
  return {
    indices: buildIndices(state, exercises, now),
    totals: buildTotals(state),
    cycle: getCycleInfo(state),
    body: buildBodyData(state),
    activityDays: buildActivityDays(state, now),
    beforeAfter: buildBeforeAfter(state, exercises),
    records: buildRecords(state, exercises),
  };
}

export function getGoalCurrentValue(goal, state, exercises, snapshot) {
  if (goal.type === "exercise")
    return Number(state.bests[goal.exerciseId]) || 0;
  if (goal.type === "weight") return snapshot.body.currentWeight;
  if (goal.type === "waist") return snapshot.body.currentWaist;
  return null;
}

export function getGoalProgress(goal, state, exercises, snapshot) {
  const current = Number(getGoalCurrentValue(goal, state, exercises, snapshot));
  const target = Number(goal.target);
  const start = Number(goal.startValue);

  if (![current, target, start].every(Number.isFinite)) return 0;
  if (target === start) return current === target ? 100 : 0;

  const progress =
    target > start
      ? (current - start) / (target - start)
      : (start - current) / (start - target);

  return Math.round(clamp(progress * 100, 0, 100));
}

export function getMuscleLoad(record) {
  const totals = Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, 0]));

  for (const set of record?.sets || []) {
    if (set.skipped) continue;
    const load = EXERCISE_LOAD[set.id] || {};
    for (const [muscle, value] of Object.entries(load)) totals[muscle] += value;
  }

  return totals;
}
