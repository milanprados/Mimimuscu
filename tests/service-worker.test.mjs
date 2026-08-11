import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync("sw.js", "utf8");
const shellMatch = source.match(/const APP_SHELL = \[([\s\S]*?)\];/);

assert.ok(shellMatch, "APP_SHELL introuvable.");

const paths = [...shellMatch[1].matchAll(/"(\.\/[^\"]+)"/g)]
  .map((match) => match[1].replace(/^\.\//, ""))
  .filter((path) => path && path !== "");

for (const path of paths) {
  assert.ok(fs.existsSync(path), `Asset PWA absent : ${path}`);
}

assert.ok(source.includes("cacheFirst"));
assert.ok(source.includes("networkFirst"));

console.log(`OK — service worker : ${paths.length} assets shell valides.`);
