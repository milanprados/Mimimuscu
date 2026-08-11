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
assert.ok(workout.includes("renderSessionHero(exercise)"));
assert.ok(workout.includes("session-editorial-screen"));
assert.ok(workout.includes("session-primary-action"));
assert.ok(workout.includes("renderRestPrep(nextExercise)"));
assert.ok(workout.includes("rest-editorial-hero"));
assert.ok(workoutCss.includes(".rest-editorial-how-scroll"));
assert.ok(workoutCss.includes(".repetition-editorial-screen"));
assert.ok(workoutCss.includes(".session-summary-screen"));
console.log(
  "OK — UI éditoriale : parcours séance unifié et écrans actifs non-scrollables.",
);
