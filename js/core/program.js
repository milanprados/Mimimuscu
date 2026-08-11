/**
 * Compilation du programme.
 *
 * Les JSON décrivent des blocs lisibles par un humain.
 * Le moteur reçoit ensuite une liste plate d'étapes explicites.
 */
import {EXERCISES, PROGRAMS} from "./catalog.js";

const clone = value => JSON.parse(JSON.stringify(value));

export function compileProgramBlocks(blocks = []) {
  const exercises = [];

  for (const block of Array.isArray(blocks) ? blocks : []) {
    const common = {
      kind: "exercise",
      phase: block.phase || "Bloc principal",
      targetScale: Number(block.target_scale) || 1,
      track: block.track !== false,
      adaptive: block.adaptive !== false,
      modeOverride: block.mode_override || null
    };

    if (block.type === "exercise") {
      const sets = Math.max(1, Number(block.sets) || 1);

      for (let set = 0; set < sets; set++) {
        exercises.push({
          ...common,
          id: block.exercise_id,
          restAfter: Number(block.rest_after_sec) || 0,
          targetOverride: block.target_override ?? null,
          tempo: block.tempo || null,
          note: block.note || "",
          test: Boolean(block.test)
        });
      }
      continue;
    }

    if (block.type === "circuit" || block.type === "superset") {
      const rounds = Math.max(1, Number(block.rounds) || 1);
      const items = Array.isArray(block.items) ? block.items : [];

      for (let round = 0; round < rounds; round++) {
        items.forEach((entry, itemIndex) => {
          const id = typeof entry === "string" ? entry : entry.exercise_id;
          const scale = typeof entry === "object" && entry.target_scale != null
            ? Number(entry.target_scale)
            : common.targetScale;

          const lastInRound = itemIndex === items.length - 1;
          const restAfter = lastInRound
            ? (round < rounds - 1 ? Number(block.rest_between_rounds_sec) || 0 : 0)
            : Number(block.rest_between_exercises_sec) || 0;

          exercises.push({
            ...common,
            id,
            round: round + 1,
            restAfter,
            targetScale: scale || 1,
            note: block.note || ""
          });
        });
      }
      continue;
    }

    throw new Error(`Type de bloc inconnu : ${block.type}`);
  }

  return exercises;
}

export function getProgramTemplate(programState = {}) {
  const sessions = Array.isArray(PROGRAMS.adaptive) ? PROGRAMS.adaptive : [];
  if (!sessions.length) throw new Error("Programme adaptatif introuvable.");

  const absoluteIndex = Math.max(0, Number(programState.index) || 0);
  const template = sessions[absoluteIndex % sessions.length];

  return {
    ...template,
    absoluteIndex,
    exerciseIds: compileProgramBlocks(template.blocks)
      .filter(item => item.track !== false)
      .map(item => item.id)
  };
}

export function getProgramTemplateAtIndex(index = 0) {
  return getProgramTemplate({index});
}

export function createProgramSession(programState) {
  const template = getProgramTemplate(programState);

  return {
    id: `program-${template.key}`,
    type: "program",
    templateKey: template.key,
    name: template.name,
    description: template.focus,
    week: template.week,
    day: template.day,
    intensity: template.intensity,
    durationTarget: 20,
    exercises: compileProgramBlocks(template.blocks)
  };
}

/**
 * Un repos de 0 seconde n'est pas inséré.
 * Cela évite une étape moteur inutile entre deux mouvements.
 */
export function createWorkoutPlan(exercises = [], metadata = {}) {
  const items = [];

  exercises.forEach((item, index) => {
    items.push({kind: "exercise", ...item});

    const rest = Number(item.restAfter) || 0;
    if (index < exercises.length - 1 && rest > 0) {
      items.push({kind: "rest", seconds: rest, phase: "Repos"});
    }
  });

  return {
    items,
    meta: {
      key: metadata.key || "custom",
      name: metadata.name || "Séance",
      focus: metadata.focus || "",
      type: metadata.type || "custom"
    }
  };
}

export function buildProgramPlan(programState, sessionDraft = null) {
  const template = getProgramTemplate(programState);

  const validDraft = Boolean(
    sessionDraft
    && sessionDraft.templateKey === template.key
    && Array.isArray(sessionDraft.exercises)
  );

  const exercises = validDraft
    ? clone(sessionDraft.exercises)
    : compileProgramBlocks(template.blocks);

  return createWorkoutPlan(exercises, {
    key: template.key,
    name: template.name,
    focus: template.focus,
    type: "program"
  });
}

export function buildSessionPlan(session) {
  const source = Array.isArray(session?.exercises)
    ? clone(session.exercises)
    : compileProgramBlocks(session?.blocks || []);

  const defaultPhase = session?.type === "program"
    ? "Bloc principal"
    : "Personnalisé";

  const exercises = source.map(item => ({
    ...item,
    kind: "exercise",
    phase: item.phase || defaultPhase
  }));

  return createWorkoutPlan(exercises, {
    key: session?.templateKey || session?.id || "custom",
    name: session?.name || "Séance personnalisée",
    focus: session?.description || "Personnalisée",
    type: session?.type || "custom"
  });
}

export function sessionToFile(session) {
  return {
    app: "mimi-muscu",
    type: "workout-session",
    version: 3,
    name: session.name || "Séance personnalisée",
    description: session.description || "",
    level: "custom",
    blocks: session.blocks || [{
      type: "circuit",
      rounds: 1,
      rest_between_exercises_sec: 25,
      rest_between_rounds_sec: 45,
      items: (session.exercises || []).map(item => item.id)
    }]
  };
}

export function validateImportedSession(raw) {
  if (!raw || raw.app !== "mimi-muscu" || raw.type !== "workout-session") {
    throw new Error("Format de séance invalide.");
  }

  let blocks = raw.blocks;

  // Compatibilité avec l'ancien format exercises[] d'import.
  if (!blocks && Array.isArray(raw.exercises)) {
    blocks = raw.exercises.map(item => ({
      type: "exercise",
      exercise_id: item.exercise_id,
      sets: item.sets || 1,
      rest_after_sec: item.rest_after_sec || 0,
      target_override: item.target_override ?? null,
      tempo: item.tempo || null,
      note: item.note || ""
    }));
  }

  const exercises = compileProgramBlocks(blocks);

  for (const item of exercises) {
    if (!EXERCISES[item.id]) throw new Error(`Exercice inconnu : ${item.id}`);
  }

  return {
    id: globalThis.crypto?.randomUUID?.() || `custom-${Date.now()}`,
    type: "custom",
    name: String(raw.name || "Séance importée").slice(0, 80),
    description: String(raw.description || "").slice(0, 240),
    blocks,
    exercises,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
