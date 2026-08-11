import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const workout = fs.readFileSync("js/ui/workout.js", "utf8");
const profile = fs.readFileSync("js/ui/profile.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

assert.ok(
  html.includes('id="resetProgression"'),
  "Bouton reset absent du HTML",
);
assert.ok(
  html.includes('id="resetProgressionModal"'),
  "Modale reset absente du HTML",
);
assert.ok(
  html.includes('id="confirmResetProgression"'),
  "Confirmation reset absente",
);
assert.ok(
  profile.includes("resetProgression(state, exercises)"),
  "Action reset non branchée",
);

assert.ok(
  workout.includes("workout-guide-description"),
  "Description du guide absente",
);
assert.ok(workout.includes("À RETENIR"), "Conseils inline absents");
assert.ok(workout.includes("À ÉVITER"), "Erreurs inline absentes");
assert.ok(workout.includes("RESPIRATION"), "Respiration inline absente");

assert.ok(html.includes('href="./styles.css"'));
assert.ok(html.includes('href="./theme.css"'));
assert.ok(html.includes('href="./workout.css"'));
assert.ok(html.includes('import("./js/app.js")'));
assert.ok(
  !html.includes("caches.delete"),
  "Le boot ne doit pas vider le cache PWA à chaque ouverture",
);
assert.ok(sw.includes("event.respondWith(networkFirst(event.request))"));

console.log(
  "OK — V32 UI visible : guide complet, reset branché, cache invalidé.",
);
