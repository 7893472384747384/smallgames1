"use strict";

const assert = require("node:assert/strict");

let storedValue = JSON.stringify({
  selectedFighter: "removed-fighter",
  unlockedLevel: 99,
  sound: false,
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
assert.equal(migrated.schemaVersion, 2);
assert.equal(migrated.selectedFighter, "pulse");
assert.equal(migrated.unlockedLevel, 4);
assert.equal(migrated.sound, false);

window.FY.saveData({ ...migrated, selectedFighter: "bomber" });
const persisted = JSON.parse(storedValue);
assert.equal(persisted.schemaVersion, 2);
assert.equal(persisted.selectedFighter, "bomber");

console.log("Save migration tests passed.");
