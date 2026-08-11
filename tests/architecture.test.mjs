import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const expected = [
  "js/app.js", "js/config.js",
  "js/core/catalog.js", "js/core/program.js", "js/core/state.js",
  "js/core/migrations.js", "js/core/workout-engine.js",
  "js/core/progression.js", "js/core/calendar.js",
  "js/ui/navigation.js", "js/ui/home.js", "js/ui/workout.js",
  "js/ui/exercise-library.js", "js/ui/session-planner.js",
  "js/ui/profile.js", "js/ui/progress.js", "js/ui/calendar.js",
  "js/utils/dom.js", "js/utils/dates.js",
  "js/utils/backup.js", "js/utils/preload.js"
];

for (const file of expected) {
  assert.ok(fs.existsSync(file), `Fichier manquant : ${file}`);
}

const jsEntries = fs.readdirSync("js");
assert.ok(!jsEntries.some(name => /^v\d/i.test(name)), "Un ancien dossier js/vXX existe encore.");

const html = fs.readFileSync("index.html", "utf8");
assert.ok(html.includes('import("./js/app.js?v=31.3")'));
assert.ok(!html.includes("/js/v30/"));

console.log("OK — architecture V31.3 canonique.");
