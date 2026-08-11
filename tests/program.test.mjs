import fs from "node:fs";
import assert from "node:assert/strict";

const exercises = JSON.parse(
  fs.readFileSync("data/exercises.json", "utf8"),
).exercises;
const sessions = JSON.parse(fs.readFileSync("data/programs.json", "utf8"))
  .programs.adaptive;
const ids = new Set(exercises.map((exercise) => exercise.id));

assert.equal(
  sessions.length,
  24,
  "Le cycle principal doit contenir 24 séances.",
);

for (const session of sessions) {
  assert.equal(
    session.duration_min,
    20,
    `${session.key}: durée cible incorrecte`,
  );

  const warmup = session.blocks.filter(
    (block) => block.phase === "Échauffement",
  );
  const main = session.blocks.filter(
    (block) => block.phase === "Bloc principal",
  );
  const cooldown = session.blocks.filter(
    (block) => block.phase === "Retour au calme",
  );

  assert.ok(warmup.length >= 4, `${session.key}: échauffement incomplet`);
  assert.equal(
    main.length,
    1,
    `${session.key}: le bloc principal doit être unique`,
  );
  assert.ok(cooldown.length >= 5, `${session.key}: retour au calme incomplet`);

  for (const block of session.blocks) {
    const entries =
      block.type === "exercise" ? [block.exercise_id] : block.items || [];

    for (const entry of entries) {
      const id = typeof entry === "string" ? entry : entry.exercise_id;
      assert.ok(ids.has(id), `${session.key}: exercice inconnu ${id}`);
    }
  }
}

console.log("OK — programme 24 séances.");
