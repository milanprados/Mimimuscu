import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const files = [];

function walk(directory) {
  for (const name of fs.readdirSync(directory)) {
    const full = path.join(directory, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".js")) files.push(full);
  }
}

walk("js");

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const imports = [...source.matchAll(/from\s+["'](\.[^"']+)["']/g)].map(match => match[1]);

  for (const specifier of imports) {
    const resolved = path.resolve(path.dirname(file), specifier);
    assert.ok(fs.existsSync(resolved), `${file}: import absent ${specifier}`);
  }
}

console.log("OK — tous les imports locaux existent.");
