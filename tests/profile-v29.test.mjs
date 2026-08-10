import fs from "node:fs";
import assert from "node:assert/strict";
const html=fs.readFileSync("index.html","utf8");
const ui=fs.readFileSync("js/v29/ui/profile-progress.js","utf8");
const migrations=fs.readFileSync("js/v29/core/migrations.js","utf8");
for(const id of [
  "profileIndex","profileAxes","profileRecords","activityHeatmap","profileCycleDots",
  "profileGoals","profileBodySummary","progressAxes","progressSinceStart","goalModal","profileEditModal"
]) assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
assert.ok(ui.includes("100 = départ")||ui.includes("progressBaseline"));
assert.ok(ui.includes("axisIndex"));
assert.ok(ui.includes("renderActivity"));
assert.ok(ui.includes("renderGoals"));
assert.ok(migrations.includes("CURRENT_STATE_VERSION = 29"));
console.log("OK — V29 profile/progression contract.");
