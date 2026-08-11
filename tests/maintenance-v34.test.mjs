import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("js/app.js", "utf8");
const workout = fs.readFileSync("js/ui/workout.js", "utf8");
const serviceWorker = fs.readFileSync("sw.js", "utf8");
const styles = ["styles.css", "theme.css", "workout.css"]
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const uiSource = fs
  .readdirSync("js/ui")
  .filter((name) => name.endsWith(".js"))
  .map((name) => fs.readFileSync(`js/ui/${name}`, "utf8"))
  .join("\n");

assert.ok(html.includes('href="./theme.css?v=34.0"'));
assert.ok(html.includes('href="./workout.css?v=34.0"'));
assert.ok(html.includes('import("./js/app.js?v=34.0")'));
assert.ok(
  html.includes('<button id="exitFocus" aria-label="Quitter la séance">'),
);
assert.ok(html.includes('<button id="audio" aria-label="Couper le son"'));

assert.ok(
  !uiSource.includes('document.createElement("style")'),
  "CSS injecté depuis le JS",
);
assert.ok(
  !uiSource.includes("MutationObserver"),
  "MutationObserver de présentation résiduel",
);
assert.ok(!app.includes("installAppTheme"));
assert.ok(!app.includes("installWorkoutTheme"));
assert.ok(!app.includes("installWorkoutRestTweaks"));

assert.ok(workout.includes('class="recovery-screen editorial-rest"'));
assert.ok(workout.includes("Guide complet →"));
assert.ok(workout.includes('on("#closeWorkoutGuide"'));
assert.ok(!workout.includes('on("#workoutGuideClose"'));
assert.ok(!workout.includes("Départ dans"));
assert.ok(!workout.includes('id="recoveryLabel"'));
assert.ok(!workout.includes('id="restCountdownNote"'));
assert.ok(workout.includes("preparing && remaining > 0"));

assert.ok(styles.includes(".rest-editorial-next-row"));
assert.match(styles, /grid-template-columns:\s*84px minmax\(0,\s*1fr\)/);
assert.match(styles, /scrollbar-width:\s*none/);
assert.equal(
  [...styles.matchAll(/!important/g)].length,
  1,
  "Seul l'utilitaire .hidden peut utiliser !important",
);

assert.ok(serviceWorker.includes('"./theme.css"'));
assert.ok(serviceWorker.includes('"./workout.css"'));
assert.ok(!serviceWorker.includes('"./js/ui/theme.js"'));
assert.ok(!serviceWorker.includes('"./js/ui/workout-theme.js"'));
assert.ok(serviceWorker.includes('const VERSION = "mimi-muscu-v34.0"'));

console.log(
  "OK — maintenance V34 : CSS statique, repos direct, cache cohérent.",
);
