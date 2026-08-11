import assert from "node:assert/strict";
import {migrateState, CURRENT_STATE_VERSION} from "../js/core/migrations.js";

const old = {
  version: 22,
  program: {level: "beginner", index: 4},
  history: [{day: "2026-08-01"}]
};

const migrated = migrateState(old);

assert.equal(migrated.version, CURRENT_STATE_VERSION);
assert.ok(migrated.profileMeta);
assert.ok(migrated.progressBaseline);
assert.ok(Array.isArray(migrated.goals));
assert.ok(migrated.calendarPrefs);
assert.equal(old.version, 22, "La migration ne doit pas muter l'objet source.");

console.log("OK — migrations V22 → V31.");
