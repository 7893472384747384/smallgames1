"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = { FY: {} };
require("../src/data/catalog.js");
require("../src/data/balance.js");

const { FIGHTERS, LEVELS, ENVIRONMENTS, BALANCE, GROWTH, CAMPAIGN_DIFFICULTY } =
  window.FY;
assert.equal(Object.keys(FIGHTERS).length, 4);
assert.equal(Object.keys(LEVELS).length, 8);
assert.equal(ENVIRONMENTS.length, 10);
assert.equal(LEVELS[5].environment, "oceanFront");
assert.equal(LEVELS[6].environment, "riverValley");
assert.equal(LEVELS[7].environment, "sandstorm");
assert.equal(LEVELS[8].environment, "thunderCanyon");
for (const asset of ["boss-chiji-game.png", "boss-kuilong-game.png"]) {
  assert.equal(
    fs.existsSync(path.join(__dirname, "..", "assets", "ships", asset)),
    true,
    `${asset} should exist`,
  );
}

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
assert.equal(GROWTH.maxRank, 4);
assert.equal(GROWTH.attributes.damage.perPoint, 0.04);
assert.equal(GROWTH.attributes.shield.perPoint, 8);
assert.equal(Object.keys(GROWTH.attributes).length, 5);
assert.deepEqual(CAMPAIGN_DIFFICULTY[8], {
  hpScale: 1.32,
  bulletSpeedScale: 1.07,
  fireRateScale: 1.105,
  bossHpScale: 1.12,
});
assert.ok(Object.isFrozen(GROWTH));
assert.ok(Object.isFrozen(CAMPAIGN_DIFFICULTY));

console.log("Catalog and balance tests passed.");
