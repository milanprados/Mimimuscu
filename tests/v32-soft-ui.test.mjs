import fs from "node:fs";
import assert from "node:assert/strict";
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const workoutCss = fs.readFileSync(
  new URL("../workout.css", import.meta.url),
  "utf8",
);
const workout = fs.readFileSync(
  new URL("../js/ui/workout.js", import.meta.url),
  "utf8",
);
assert.ok(css.includes("V32 — Soft Athletic Minimalism"));
assert.match(css, /\.focus-content\s*\{[^}]*overflow:\s*hidden/s);
assert.ok(workout.includes('renderQuickCue(exercise, "repGuide")'));
assert.ok(workout.includes("renderRestPrep(nextExercise)"));
assert.ok(workout.includes("Illustration à venir"));
assert.ok(workout.includes("rest-editorial-hero"));
assert.ok(workoutCss.includes(".rest-editorial-how-scroll"));
console.log(
  "OK — UI éditoriale : séance non-scrollable, repos enrichi, placeholders.",
);
