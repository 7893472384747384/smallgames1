"use strict";

const assert = require("node:assert/strict");

let storedValue = JSON.stringify({
  selectedFighter: "removed-fighter",
  unlockedLevel: 99,
  sound: false,
  bestRanks: { 1: "A", 6: "S" },
  growth: { damage: 4, shield: 1, unknown: 99 },
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
require("../src/data/balance.js");
require("../src/services/storage.js");

const migrated = window.FY.loadSave();
assert.equal(migrated.schemaVersion, 4);
assert.equal(migrated.selectedFighter, "pulse");
assert.equal(migrated.unlockedLevel, 8);
assert.equal(migrated.sound, false);
assert.deepEqual(migrated.bestRanks, { 1: "A", 6: "S" });
assert.deepEqual(migrated.growth, {
  damage: 2,
  shield: 0,
  regen: 0,
  speed: 0,
  energy: 0,
});

window.FY.saveData({ ...migrated, selectedFighter: "bomber" });
const persisted = JSON.parse(storedValue);
assert.equal(persisted.schemaVersion, 4);
assert.equal(persisted.selectedFighter, "bomber");
assert.deepEqual(persisted.bestRanks, { 1: "A", 6: "S" });

storedValue = JSON.stringify({
  unlockedLevel: 6,
  bestRanks: { 6: "A" },
});
assert.equal(window.FY.loadSave().unlockedLevel, 7);
assert.deepEqual(window.FY.loadSave().growth, {
  damage: 0,
  shield: 0,
  regen: 0,
  speed: 0,
  energy: 0,
});
assert.equal(
  window.FY.getEarnedGrowthPoints({ 1: "C", 2: "S", 9: "A", 3: "invalid" }),
  2,
);

console.log("Save migration tests passed.");
