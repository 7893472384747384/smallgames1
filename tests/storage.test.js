"use strict";

const assert = require("node:assert/strict");

let storedValue = JSON.stringify({
  selectedFighter: "removed-fighter",
  unlockedLevel: 99,
  sound: false,
  bestRanks: { 1: "A", 6: "S" },
});

global.window = {
  FY: {
    STORAGE_KEY: "fengyun-fighter-save-v1",
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  },
};
global.localStorage = {
  getItem: () => storedValue,
  setItem: (_key, value) => {
    storedValue = value;
  },
};

require("../src/data/catalog.js");
require("../src/services/storage.js");

const migrated = window.FY.loadSave();
assert.equal(migrated.schemaVersion, 3);
assert.equal(migrated.selectedFighter, "pulse");
assert.equal(migrated.unlockedLevel, 8);
assert.equal(migrated.sound, false);
assert.deepEqual(migrated.bestRanks, { 1: "A", 6: "S" });

window.FY.saveData({ ...migrated, selectedFighter: "bomber" });
const persisted = JSON.parse(storedValue);
assert.equal(persisted.schemaVersion, 3);
assert.equal(persisted.selectedFighter, "bomber");
assert.deepEqual(persisted.bestRanks, { 1: "A", 6: "S" });

storedValue = JSON.stringify({
  unlockedLevel: 6,
  bestRanks: { 6: "A" },
});
assert.equal(window.FY.loadSave().unlockedLevel, 7);

console.log("Save migration tests passed.");
