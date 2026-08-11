/**
 * Chargement et normalisation des données.
 *
 * Les JSON restent la source de vérité éditable :
 * - data/exercises.json
 * - data/exercise_families.json
 * - data/programs.json
 * - data/milestones.json
 */
async function loadJson(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Impossible de charger ${relativePath}`);
  return response.json();
}

const [
  exerciseCatalog,
  familyCatalog,
  programCatalog,
  milestoneCatalog
] = await Promise.all([
  loadJson("../../data/exercises.json"),
  loadJson("../../data/exercise_families.json"),
  loadJson("../../data/programs.json"),
  loadJson("../../data/milestones.json")
]);

function localAssetUrl(path) {
  return new URL(`../../${path}`, import.meta.url).href;
}

function normalizeExercise(raw) {
  const localVisual = raw.visual?.provider === "local";

  return {
    id: raw.id,
    name: raw.name,
    aliases: raw.aliases || [],
    category: raw.category,
    pattern: raw.movement_pattern,
    difficulty: raw.difficulty,

    mode: raw.mode,
    base: raw.prescription.base,
    min: raw.prescription.min,
    max: raw.prescription.max,
    step: raw.prescription.step,
    perSide: Boolean(raw.prescription.per_side),

    quiet: Boolean(raw.constraints.quiet),
    impact: raw.constraints.impact,
    equipment: raw.constraints.equipment,

    primary: raw.muscles.primary,
    secondary: raw.muscles.secondary,
    stabilizers: raw.muscles.stabilizers || "",

    familyId: raw.family_id,
    variantTier: raw.variant_tier,
    description: raw.description || "",
    guide: raw.guide || {},

    tips: raw.guide?.tips || raw.coaching.tips || [],
    mistakes: raw.guide?.errors || raw.coaching.mistakes || [],
    breathing: raw.guide?.breathing || raw.coaching.breathing || "",
    easierText: raw.coaching.easier || "",
    harderText: raw.coaching.harder || "",

    images: localVisual
      ? [localAssetUrl(raw.visual.start), localAssetUrl(raw.visual.end)]
      : [],
    thumb: localVisual ? localAssetUrl(raw.visual.thumb) : null
  };
}

export const EXERCISES = Object.fromEntries(
  exerciseCatalog.exercises.map(raw => {
    const exercise = normalizeExercise(raw);
    return [exercise.id, exercise];
  })
);

export const FAMILIES = familyCatalog.families.map(family => ({
  ...family,
  base: EXERCISES[family.base_id],
  allIds: [
    ...(family.variants.easier || []),
    ...(family.variants.standard || []),
    ...(family.variants.variations || []),
    ...(family.variants.harder || [])
  ]
}));

export const PROGRAMS = programCatalog.programs;

export const MILESTONES = milestoneCatalog.milestones.map(item => ({
  id: item.id,
  exerciseId: item.exercise_id,
  label: item.label,
  value: item.value,
  mode: item.mode
}));
