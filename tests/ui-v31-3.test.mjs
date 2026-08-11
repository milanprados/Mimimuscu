import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const workout = fs.readFileSync("js/ui/workout.js", "utf8");
const profile = fs.readFileSync("js/ui/profile.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

assert.ok(html.includes('id="resetProgression"'), "Bouton reset absent du HTML");
assert.ok(html.includes('id="resetProgressionModal"'), "Modale reset absente du HTML");
assert.ok(html.includes('id="confirmResetProgression"'), "Confirmation reset absente");
assert.ok(profile.includes('resetProgression(state, exercises)'), "Action reset non branchée");

assert.ok(workout.includes('inline-guide-description'), "Description inline absente");
assert.ok(workout.includes('À RETENIR'), "Conseils inline absents");
assert.ok(workout.includes('À ÉVITER'), "Erreurs inline absentes");
assert.ok(workout.includes('RESPIRATION'), "Respiration inline absente");

assert.ok(html.includes('styles.css?v=32.1'));
assert.ok(html.includes('app.js?v=32.1'));
assert.ok(html.includes('caches.delete'), "Purge de cache de migration absente");
assert.ok(sw.includes('/\\.(?:js|css|json)$/i') || sw.includes('js|css|json'), "Code/données pas en network-first");

console.log("OK — V32 UI visible : guide complet, reset branché, cache invalidé.");
