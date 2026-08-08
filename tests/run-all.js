"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const tests = ["catalog.test.js", "storage.test.js", "smoke.js", "standalone.test.js"];
for (const test of tests) {
  const result = spawnSync(process.execPath, [path.join(__dirname, test)], {
    encoding: "utf8",
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`All ${tests.length} test suites passed.`);
