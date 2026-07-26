"use strict";

const assert = require("node:assert/strict");

global.window = { FY: {} };
require("../src/data/catalog.js");
require("../src/data/balance.js");

const { FIGHTERS, LEVELS, ENVIRONMENTS, BALANCE } = window.FY;
assert.equal(Object.keys(FIGHTERS).length, 4);
assert.equal(Object.keys(LEVELS).length, 6);
assert.equal(ENVIRONMENTS.length, 10);
assert.equal(LEVELS[5].environment, "oceanFront");
assert.equal(LEVELS[6].environment, "riverValley");

for (const fighter of Object.values(FIGHTERS)) {
  assert.ok(fighter.name);
  assert.ok(fighter.weapon);
  assert.ok(fighter.sprite);
  assert.ok(fighter.image.endsWith(".png"));
  assert.ok(fighter.tagline);
}

assert.equal(BALANCE.dual.interval, 0.18);
assert.equal(BALANCE.bomber.radius, 58);
assert.equal(BALANCE.bomber.lockDelay, 0.3);
assert.equal(BALANCE.amplifier.maxCharges, 3);
assert.equal(BALANCE.amplifier.duration, 7);
assert.equal(BALANCE.amplifier.weaponCopies, 2);
assert.ok(Object.isFrozen(BALANCE));

console.log("Catalog and balance tests passed.");
