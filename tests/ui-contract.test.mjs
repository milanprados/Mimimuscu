import fs from "node:fs";
import assert from "node:assert/strict";

const html=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("js/v27/app.js","utf8");
const helpers=fs.readFileSync("js/v27/helpers.js","utf8");
const css=fs.readFileSync("styles.css","utf8");

for(const id of ["modal","closeModal","sessionTab","exercisesTab","progressTab","profileTab"]){
  assert.ok(html.includes(`id="${id}"`),`ID manquant: ${id}`);
}
assert.ok(app.includes("closeAllLayers();"),"showTab doit fermer les overlays");
assert.ok(helpers.includes("export function closeAllLayers"),"helper closeAllLayers absent");
assert.ok(css.includes(".modal{position:fixed;inset:0;z-index:2000"),"modal doit recouvrir la navigation");
assert.ok(css.includes(".tabs{position:fixed")&&css.includes("z-index:800"),"navigation doit rester sous les modales");

console.log("OK — contrat UI: navigation, modal exercice et fermeture globale.");
