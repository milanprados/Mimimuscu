import { spawnSync } from "node:child_process";

const tests = [
  "tests/architecture.test.mjs",
  "tests/program.test.mjs",
  "tests/calendar.test.mjs",
  "tests/migrations.test.mjs",
  "tests/state-reset.test.mjs",
  "tests/ui-v31-3.test.mjs",
  "tests/dom-contract.test.mjs",
  "tests/imports.test.mjs",
  "tests/service-worker.test.mjs",
  "tests/workout-engine.test.mjs",
  "tests/stability-v31-4.test.mjs",
  "tests/v32-soft-ui.test.mjs",
  "tests/maintenance-v34.test.mjs",
];

for (const test of tests) {
  const result = spawnSync(process.execPath, [test], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.status !== 0) process.exit(result.status || 1);
}

console.log("\nOK — suite V34 complète.");
