import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("js/app.js", "utf8");
const game = fs.readFileSync("js/ui/tetris.js", "utf8");
const css = fs.readFileSync("theme.css", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");

assert.ok(html.includes('id="tetrisTab"'));
assert.ok(html.includes('data-tab="tetris"'));
assert.ok(html.includes('id="tetrisBoard"'));
assert.ok(html.includes('data-tetris-action="rotate"'));
assert.ok(html.includes('data-tetris-action="drop"'));
assert.ok(app.includes('tabName === "tetris"'));
assert.ok(game.includes("const COLS = 10"));
assert.ok(game.includes("const ROWS = 20"));
assert.ok(game.includes('BEST_SCORE_KEY = "mimi-tetris-best"'));
assert.ok(game.includes('canvas.addEventListener("pointerdown"'));
assert.ok(game.includes('document.addEventListener("visibilitychange"'));
assert.ok(css.includes("touch-action: none"));
assert.ok(css.includes("repeat(5, minmax(0, 1fr))"));
assert.ok(worker.includes('"./js/ui/tetris.js"'));

console.log("OK — Tetris mobile : navigation, tactile, pause et record local.");
