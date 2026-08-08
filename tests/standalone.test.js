"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const builder = path.join(root, "tools", "build-standalone.js");
const output = path.join(root, "dist", "风云战机-安卓单文件版.html");
const build = spawnSync(process.execPath, [builder], { encoding: "utf8" });

assert.equal(build.status, 0, build.stderr || build.stdout);
assert.equal(fs.existsSync(output), true);

const html = fs.readFileSync(output, "utf8");
const size = fs.statSync(output).size;
assert.ok(size > 4_000_000, "standalone file should contain runtime images");
assert.ok(size < 12_000_000, "standalone file should remain practical to transfer");
assert.match(html, /风云战机安卓单文件版/);
assert.match(html, /data:image\/png;base64,/);
assert.doesNotMatch(html, /<script\s+src=/i);
assert.doesNotMatch(html, /<link\s+rel="stylesheet"/i);
assert.doesNotMatch(html, /assets\/ships\//i);
assert.doesNotMatch(html, /https?:\/\//i);

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(
  (match) => match[1],
);
assert.equal(scripts.length, 17);
for (const script of scripts) {
  assert.doesNotThrow(() => new Function(script));
}

console.log("Android standalone HTML build test passed.");
