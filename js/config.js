/**
 * Mimi Muscu — configuration centrale.
 * Modifie ici les constantes globales plutôt que de les dupliquer ailleurs.
 */
export const APP_VERSION = "34.0";

export const STORAGE = {
  currentKey: "mimiMuscuV31",
  legacyKeys: [
    "mimiMuscuV30",
    "mimiMuscuV29",
    "mimiMuscuV26",
    "mimiMuscuV22",
    "mimiMuscuV20",
    "coachV20",
    "coachV19",
    "coachV18",
  ],
};

export const PROGRAM = {
  cycleLength: 24,
  sessionsPerWeek: 6,
  targetDurationMinutes: 20,
  defaultRestDay: 0, // 0 = dimanche
};

export const PROGRESSION = {
  xpPerLevel: 500,
  historyLimit: 180,
  baselineIndex: 100,
};

export const UI = {
  exerciseImageFlipMs: 1400,
  countdownStepMs: 850,
};
