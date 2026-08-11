import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const exercises = read("data/exercises.json").exercises;
const programs = read("data/programs.json");
const milestones = read("data/milestones.json").milestones;
const benchmarks = read("data/benchmarks.json").sessions;

const errors = [];
const ids = new Set();

for (const ex of exercises) {
  if (ids.has(ex.id)) errors.push(`ID dupliqué: ${ex.id}`);
  ids.add(ex.id);
  if (!ex.name) errors.push(`Nom manquant: ${ex.id}`);
  const p = ex.prescription || {};
  if (!(p.min <= p.base && p.base <= p.max))
    errors.push(`Prescription invalide: ${ex.id}`);
  if (!ex.muscles?.primary) errors.push(`Muscle principal manquant: ${ex.id}`);
  if (!Array.isArray(ex.coaching?.tips) || !ex.coaching.tips.length)
    errors.push(`Tips manquants: ${ex.id}`);
  if (!ex.visual?.asset_id) errors.push(`Asset visuel manquant: ${ex.id}`);
}

const checkId = (id, where) => {
  if (!ids.has(id)) errors.push(`Exercice inconnu "${id}" dans ${where}`);
};
for (const [level, list] of Object.entries(programs.programs)) {
  for (const session of list) {
    for (const block of session.blocks || []) {
      if (block.type === "exercise")
        checkId(block.exercise_id, `${level}/${session.key}`);
      for (const id of block.items || [])
        checkId(id, `${level}/${session.key}`);
    }
  }
}
for (const m of milestones) checkId(m.exercise_id, `milestone ${m.id}`);
for (const s of benchmarks)
  for (const b of s.blocks || [])
    if (b.exercise_id) checkId(b.exercise_id, `benchmark ${s.id}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `OK — ${exercises.length} exercices, programmes/milestones/benchmarks valides.`,
);
