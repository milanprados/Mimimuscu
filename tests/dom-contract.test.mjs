import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const htmlIds = new Set(
  [...html.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(match => match[1])
);

const jsFiles = [];

function walk(directory) {
  for (const name of fs.readdirSync(directory)) {
    const full = path.join(directory, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".js")) jsFiles.push(full);
  }
}

walk("js");

const source = jsFiles.map(file => fs.readFileSync(file, "utf8")).join("\n");
const referencedIds = [
  ...source.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)
].map(match => match[1]);

const dynamicIds = new Set([
  "addExercise", "askCoachAfter", "calendarStartToday",
  "count", "done", "early", "equipmentFilter", "finish",
  "minus", "pause", "plus", "quietFilter", "repVal",
  "rest", "skip", "skipRest", "skipTimed", "time",
  "timerPoseLabel", "timerVisual"
]);

const missing = [...new Set(referencedIds)]
  .filter(id => !htmlIds.has(id) && !dynamicIds.has(id));

assert.deepEqual(missing, [], `IDs HTML manquants : ${missing.join(", ")}`);

console.log("OK — contrat DOM.");
