import assert from "node:assert/strict";
import {buildRollingSchedule} from "../js/core/calendar.js";
import {localDayKey, monthCells} from "../js/utils/dates.js";

const templates = Array.from({length: 24}, (_, index) => ({
  key: `W${Math.floor(index / 6) + 1}D${index % 6 + 1}`,
  week: Math.floor(index / 6) + 1,
  day: index % 6 + 1
}));

const monday = new Date(2026, 7, 10);

const schedule = buildRollingSchedule({
  today: monday,
  programIndex: 0,
  programTemplates: templates,
  restDay: 0,
  days: 8
});

assert.equal(schedule[0].template.key, "W1D1");
assert.equal(schedule[5].template.key, "W1D6");
assert.equal(schedule[6].type, "rest");
assert.equal(schedule[7].template.key, "W2D1");

const afterWorkout = buildRollingSchedule({
  today: monday,
  programIndex: 1,
  programTemplates: templates,
  restDay: 0,
  programDoneToday: true,
  days: 2
});

assert.equal(afterWorkout[0].type, "done-today");
assert.equal(afterWorkout[1].template.key, "W1D2");
assert.equal(localDayKey(monday), "2026-08-10");
assert.equal(monthCells(2026, 7).length, 42);

console.log("OK — calendrier glissant.");
