"use strict";

const assert = require("node:assert/strict");

const noOp = () => {};
const gradient = { addColorStop: noOp };
const context = new Proxy(
  {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: () => ({ width: 0 }),
  },
  {
    get(target, property) {
      if (property in target) return target[property];
      return noOp;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  },
);

const elements = new Map();
const createElement = (id = "") => {
  const element = {
    id,
    hidden: false,
    checked: true,
    textContent: "",
    className: "",
    children: [],
    classList: { add: noOp, remove: noOp, toggle: noOp },
    addEventListener: noOp,
    setAttribute: noOp,
    append(...children) {
      this.children.push(...children);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
  };
  return element;
};

const canvas = {
  ...createElement("gameCanvas"),
  getContext: () => context,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 450, height: 800 }),
  setPointerCapture: noOp,
  releasePointerCapture: noOp,
};
elements.set("gameCanvas", canvas);

global.document = {
  hidden: false,
  title: "",
  addEventListener: noOp,
  createElement: () => createElement(),
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  },
};
global.window = {
  location: { search: "" },
  addEventListener: noOp,
  AudioContext: null,
  webkitAudioContext: null,
};
let storedSave = JSON.stringify({ unlockedLevel: 6, sound: false });
global.localStorage = {
  getItem: () => storedSave,
  setItem: (_key, value) => {
    storedSave = value;
  },
};
global.Image = class {
  constructor() {
    this.complete = true;
    this.naturalWidth = 512;
    this.decoding = "async";
    this.src = "";
  }
};
let frameCallback = null;
global.requestAnimationFrame = (callback) => {
  if (!frameCallback) frameCallback = callback;
};

require("../src/core/runtime.js");
require("../src/data/catalog.js");
require("../src/data/balance.js");
require("../src/ui/hangar.js");
require("../src/services/storage.js");
require("../src/services/audio.js");
require("../src/systems/director.js");
require("../src/systems/hazards.js");
require("../src/systems/weapons.js");
require("../src/systems/bosses.js");
require("../src/systems/combat.js");
require("../src/render/backgrounds.js");
require("../src/render/entities.js");
require("../src/render/effects.js");
require("../src/render/hud.js");
require("../src/core/game.js");
require("../src/main.js");

window.__FENGYUN_GAME__.setGrowthTestProgress([1, 2, 3, 4]);
assert.equal(window.__FENGYUN_GAME__.snapshot().growth.available, 4);
window.__FENGYUN_GAME__.allocateGrowth("damage");
window.__FENGYUN_GAME__.allocateGrowth("shield");
window.__FENGYUN_GAME__.allocateGrowth("regen");
window.__FENGYUN_GAME__.allocateGrowth("speed");
assert.deepEqual(window.__FENGYUN_GAME__.snapshot().growth.allocations, {
  damage: 1,
  shield: 1,
  regen: 1,
  speed: 1,
  energy: 0,
});
assert.equal(window.__FENGYUN_GAME__.snapshot().growth.available, 0);
assert.equal(window.__FENGYUN_GAME__.snapshot().player.maxShield, 108);
assert.equal(window.__FENGYUN_GAME__.snapshot().growth.bonuses.damageScale, 1.04);
window.__FENGYUN_GAME__.resetGrowth();
assert.equal(window.__FENGYUN_GAME__.snapshot().growth.available, 4);
assert.equal(window.__FENGYUN_GAME__.snapshot().player.maxShield, 100);
window.__FENGYUN_GAME__.allocateGrowth("damage");
window.__FENGYUN_GAME__.allocateGrowth("shield");

window.__FENGYUN_GAME__.selectFighter("laser");
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.id, "laser");
assert.equal(JSON.parse(storedSave).selectedFighter, "laser");
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.advanceWorld(0.5);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.laserActive, true);
assert.ok(window.__FENGYUN_GAME__.snapshot().fighter.laserHeat >= 11);
assert.equal(window.__FENGYUN_GAME__.snapshot().playerBullets, 0);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.id, "laser");
window.__FENGYUN_GAME__.advanceWorld(4);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.laserCooling, true);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.grantAmplifiers(1);
window.__FENGYUN_GAME__.activateAmplifier();
window.__FENGYUN_GAME__.advanceWorld(0.02);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.laserBeamCount, 2);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.skipToBoss();
const bossHpBeforeLaser = window.__FENGYUN_GAME__.snapshot().boss.hp;
const bossPartHpBeforeLaser = window.__FENGYUN_GAME__.snapshot().boss.parts.reduce(
  (sum, part) => sum + part.hp,
  0,
);
window.__FENGYUN_GAME__.advanceWorld(3.5);
assert.ok(
  window.__FENGYUN_GAME__.snapshot().boss.hp < bossHpBeforeLaser ||
    window.__FENGYUN_GAME__.snapshot().boss.parts.reduce((sum, part) => sum + part.hp, 0) <
      bossPartHpBeforeLaser,
);

window.__FENGYUN_GAME__.startLevelThree();
frameCallback(performance.now() + 16);
assert.equal(window.__FENGYUN_GAME__.snapshot().level, 3);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "windCorridor");
window.__FENGYUN_GAME__.skipToBoss();
assert.deepEqual(
  {
    kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
    hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
    weather: window.__FENGYUN_GAME__.snapshot().weather,
  },
  { kind: "gale", hp: 3016, weather: "galeBoss" },
);

window.__FENGYUN_GAME__.startLevelFour();
frameCallback(performance.now() + 32);
assert.equal(window.__FENGYUN_GAME__.snapshot().level, 4);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "powerGrid");
window.__FENGYUN_GAME__.skipToBoss();
assert.deepEqual(
  {
    kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
    hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
    weather: window.__FENGYUN_GAME__.snapshot().weather,
  },
  { kind: "volt", hp: 3392, weather: "voltBoss" },
);

window.__FENGYUN_GAME__.startLevelFive();
frameCallback(performance.now() + 48);
assert.equal(window.__FENGYUN_GAME__.snapshot().level, 5);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "oceanFront");
window.__FENGYUN_GAME__.skipToBoss();
assert.deepEqual(
  {
    kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
    hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
    weather: window.__FENGYUN_GAME__.snapshot().weather,
  },
  { kind: "tide", hp: 3834, weather: "tideBoss" },
);
window.__FENGYUN_GAME__.advanceWorld(1.4);
assert.ok(window.__FENGYUN_GAME__.snapshot().hazards.tideSurges > 0);

window.__FENGYUN_GAME__.startLevelSix();
frameCallback(performance.now() + 64);
assert.equal(window.__FENGYUN_GAME__.snapshot().level, 6);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "riverValley");
window.__FENGYUN_GAME__.skipToBoss();
assert.deepEqual(
  {
    kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
    hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
    weather: window.__FENGYUN_GAME__.snapshot().weather,
  },
  { kind: "ridge", hp: 4290, weather: "ridgeBoss" },
);
window.__FENGYUN_GAME__.advanceWorld(1.35);
assert.ok(window.__FENGYUN_GAME__.snapshot().hazards.rockfalls > 0);
window.__FENGYUN_GAME__.damageBossPart("left");
window.__FENGYUN_GAME__.damageBossPart("right");
assert.equal(
  window.__FENGYUN_GAME__.snapshot().boss.parts.filter((part) => part.destroyed).length,
  2,
);
assert.equal(window.__FENGYUN_GAME__.snapshot().runStats.bossPartsDestroyed, 2);
window.__FENGYUN_GAME__.setRatingTestState({ hull: 3, hits: 4 });
assert.equal(window.__FENGYUN_GAME__.getCampaignRating().rank, "S");
window.__FENGYUN_GAME__.setRatingTestState({ hull: 2, hits: 0 });
assert.equal(window.__FENGYUN_GAME__.getCampaignRating().rank, "A");
window.__FENGYUN_GAME__.setRatingTestState({ hull: 3, hits: 0 });
window.__FENGYUN_GAME__.spawnFunctionalEnemies();
assert.deepEqual(window.__FENGYUN_GAME__.snapshot().enemyTypes, {
  guardian: 1,
  medic: 1,
  minelayer: 1,
  carrier: 1,
});
window.__FENGYUN_GAME__.advanceWorld(4.5);
assert.ok(window.__FENGYUN_GAME__.snapshot().enemyTypes.scout >= 2);

window.__FENGYUN_GAME__.startLevelSeven();
frameCallback(performance.now() + 80);
assert.equal(window.__FENGYUN_GAME__.snapshot().level, 7);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "sandstorm");
window.__FENGYUN_GAME__.skipToBoss();
assert.deepEqual(
  {
    kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
    hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
    weather: window.__FENGYUN_GAME__.snapshot().weather,
  },
  { kind: "chiji", hp: 4718, weather: "chijiBoss" },
);
window.__FENGYUN_GAME__.advanceWorld(3.2);
assert.equal(window.__FENGYUN_GAME__.snapshot().hazards.sandFront, 1);
const sandEdgeBeforePartBreak =
  window.__FENGYUN_GAME__.snapshot().hazards.sandFrontEdgeY;
window.__FENGYUN_GAME__.damageBossPart("left");
assert.equal(window.__FENGYUN_GAME__.snapshot().boss.parts[0].destroyed, true);
assert.ok(
  window.__FENGYUN_GAME__.snapshot().hazards.sandFrontEdgeY >
    sandEdgeBeforePartBreak,
);

window.__FENGYUN_GAME__.startLevelEight();
frameCallback(performance.now() + 96);
assert.equal(window.__FENGYUN_GAME__.snapshot().level, 8);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "thunderCanyon");
window.__FENGYUN_GAME__.skipToBoss();
assert.deepEqual(
  {
    kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
    hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
    weather: window.__FENGYUN_GAME__.snapshot().weather,
  },
  { kind: "kuilong", hp: 5264, weather: "kuilongBoss" },
);
window.__FENGYUN_GAME__.damageBossPart("left");
window.__FENGYUN_GAME__.advanceWorld(1.4);
assert.ok(window.__FENGYUN_GAME__.snapshot().hazards.stormSectors > 0);
assert.ok(
  window.__FENGYUN_GAME__.snapshot().hazards.stormSectorIndices.every(
    (sector) => sector >= 2,
  ),
);

const chapterThreeLevels = [
  { level: 9, environment: "polarNight", kind: "shuangyuan", hp: 5763, weather: "shuangyuanBoss", hazard: "frostWaves", difficulty: [1.38, 1.08, 1.12, 1.13] },
  { level: 10, environment: "orbitalRuins", kind: "tianshu", hp: 6325, weather: "tianshuBoss", hazard: "gravityWells", difficulty: [1.44, 1.09, 1.135, 1.15] },
  { level: 11, environment: "volcanicCaldera", kind: "zhurong", hp: 6844, weather: "zhurongBoss", hazard: "magmaVents", difficulty: [1.5, 1.1, 1.15, 1.16] },
  { level: 12, environment: "prismCitadel", kind: "yaota", hp: 7424, weather: "yaotaBoss", hazard: "prismSweeps", difficulty: [1.56, 1.11, 1.165, 1.16] },
];
for (const entry of chapterThreeLevels) {
  window.__FENGYUN_GAME__.start(entry.level);
  frameCallback(performance.now() + entry.level * 16);
  assert.equal(window.__FENGYUN_GAME__.snapshot().environment, entry.environment);
  assert.deepEqual(window.__FENGYUN_GAME__.snapshot().campaignDifficulty, {
    hpScale: entry.difficulty[0],
    bulletSpeedScale: entry.difficulty[1],
    fireRateScale: entry.difficulty[2],
    bossHpScale: entry.difficulty[3],
  });
  window.__FENGYUN_GAME__.advanceWorld(10);
  window.__FENGYUN_GAME__.advanceWorld(3);
  assert.ok(window.__FENGYUN_GAME__.snapshot().hazards[entry.hazard] >= 1);
  window.__FENGYUN_GAME__.spawnCurrentLevelHazard();
  frameCallback(performance.now() + entry.level * 20);
  assert.ok(window.__FENGYUN_GAME__.snapshot().hazards[entry.hazard] >= 1);
  window.__FENGYUN_GAME__.advanceWorld(1.1);
  assert.ok(window.__FENGYUN_GAME__.snapshot().hazards[entry.hazard] >= 1);
  window.__FENGYUN_GAME__.skipToBoss();
  frameCallback(performance.now() + entry.level * 24);
  assert.deepEqual(
    {
      kind: window.__FENGYUN_GAME__.snapshot().boss.kind,
      hp: window.__FENGYUN_GAME__.snapshot().boss.hp,
      weather: window.__FENGYUN_GAME__.snapshot().weather,
    },
    { kind: entry.kind, hp: entry.hp, weather: entry.weather },
  );
  assert.equal(window.__FENGYUN_GAME__.snapshot().boss.parts.length, 2);
  window.__FENGYUN_GAME__.advanceWorld(4.5);
  assert.equal(window.__FENGYUN_GAME__.snapshot().boss.kind, entry.kind);
}

window.__FENGYUN_GAME__.startEndless();
assert.deepEqual(
  {
    mode: window.__FENGYUN_GAME__.snapshot().mode,
    environment: window.__FENGYUN_GAME__.snapshot().environment,
    pressure: window.__FENGYUN_GAME__.snapshot().endless.pressure,
    nextBossIn: window.__FENGYUN_GAME__.snapshot().endless.nextBossIn,
  },
  { mode: "endless", environment: "skyCity", pressure: 1, nextBossIn: 75 },
);

window.__FENGYUN_GAME__.advanceEndless(62);
assert.equal(window.__FENGYUN_GAME__.snapshot().endless.pressure, 3);
assert.equal(window.__FENGYUN_GAME__.snapshot().endless.sector, 2);
assert.equal(window.__FENGYUN_GAME__.snapshot().environment, "cloudSea");
assert.equal(window.__FENGYUN_GAME__.snapshot().state, "upgrade");
window.__FENGYUN_GAME__.chooseEndlessUpgrade(0);
assert.equal(window.__FENGYUN_GAME__.snapshot().state, "playing");
assert.equal(window.__FENGYUN_GAME__.snapshot().endless.upgradeCount, 1);
assert.equal(window.__FENGYUN_GAME__.snapshot().endless.upgrades[0], "damage");

window.__FENGYUN_GAME__.skipToBoss();
assert.equal(window.__FENGYUN_GAME__.snapshot().boss.kind, "yubo");
assert.ok(window.__FENGYUN_GAME__.snapshot().boss.hp > 2100);
window.__FENGYUN_GAME__.damageBoss(99999);
window.__FENGYUN_GAME__.advanceEndless(4);
assert.equal(window.__FENGYUN_GAME__.snapshot().boss, null);
assert.equal(window.__FENGYUN_GAME__.snapshot().endless.bossesDefeated, 1);
assert.ok(window.__FENGYUN_GAME__.snapshot().endless.nextBossIn >= 70);
window.__FENGYUN_GAME__.endEndless();
assert.equal(window.__FENGYUN_GAME__.snapshot().state, "gameover");
assert.ok(JSON.parse(storedSave).bestEndlessTime >= 63);
assert.ok(JSON.parse(storedSave).bestEndlessScore > 0);
window.__FENGYUN_GAME__.startEndless();
window.__FENGYUN_GAME__.pause();
assert.equal(window.__FENGYUN_GAME__.snapshot().state, "paused");
window.__FENGYUN_GAME__.returnToHangar();
assert.deepEqual(
  {
    state: window.__FENGYUN_GAME__.snapshot().state,
    mode: window.__FENGYUN_GAME__.snapshot().mode,
    time: window.__FENGYUN_GAME__.snapshot().time,
  },
  { state: "menu", mode: "campaign", time: 0 },
);
window.__FENGYUN_GAME__.returnToHangar();
window.__FENGYUN_GAME__.selectFighter("pulse");
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.advanceWorld(0.2);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.id, "pulse");
assert.ok(window.__FENGYUN_GAME__.snapshot().playerBullets > 0);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.laserHeat, 0);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.grantAmplifiers(9);
assert.equal(window.__FENGYUN_GAME__.snapshot().player.amplifierCharges, 3);
window.__FENGYUN_GAME__.activateAmplifier();
assert.equal(window.__FENGYUN_GAME__.snapshot().player.amplifierCharges, 2);
assert.equal(window.__FENGYUN_GAME__.snapshot().player.amplifierTimer, 7);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.weaponCopies, 2);
window.__FENGYUN_GAME__.advanceWorld(0.02);
assert.equal(window.__FENGYUN_GAME__.snapshot().playerBullets, 4);
window.__FENGYUN_GAME__.activateAmplifier();
assert.equal(window.__FENGYUN_GAME__.snapshot().player.amplifierCharges, 1);
assert.equal(window.__FENGYUN_GAME__.snapshot().player.amplifierTimer, 14);
window.__FENGYUN_GAME__.advanceWorld(10);
window.__FENGYUN_GAME__.advanceWorld(4.1);
assert.equal(window.__FENGYUN_GAME__.snapshot().player.amplifierTimer, 0);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.weaponCopies, 1);

window.__FENGYUN_GAME__.returnToHangar();
window.__FENGYUN_GAME__.selectFighter("dual");
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.id, "dual");
assert.equal(JSON.parse(storedSave).selectedFighter, "dual");
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.advanceWorld(0.02);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.dualLaserActive, true);
assert.ok(window.__FENGYUN_GAME__.snapshot().fighter.dualLaserFireTimer < 0.18);
assert.equal(window.__FENGYUN_GAME__.snapshot().playerBullets, 2);
window.__FENGYUN_GAME__.advanceWorld(0.08);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.dualLaserActive, false);
assert.equal(window.__FENGYUN_GAME__.snapshot().playerBullets, 2);
window.__FENGYUN_GAME__.advanceWorld(0.09);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.dualLaserActive, true);
assert.equal(window.__FENGYUN_GAME__.snapshot().playerBullets, 4);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.grantAmplifiers(1);
window.__FENGYUN_GAME__.activateAmplifier();
window.__FENGYUN_GAME__.advanceWorld(0.02);
assert.equal(window.__FENGYUN_GAME__.snapshot().playerBullets, 4);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.skipToBoss();
const bossHpBeforeDualLaser = window.__FENGYUN_GAME__.snapshot().boss.hp;
window.__FENGYUN_GAME__.advanceWorld(3.5);
assert.ok(window.__FENGYUN_GAME__.snapshot().boss.hp < bossHpBeforeDualLaser);

window.__FENGYUN_GAME__.returnToHangar();
window.__FENGYUN_GAME__.selectFighter("bomber");
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.id, "bomber");
assert.equal(JSON.parse(storedSave).selectedFighter, "bomber");
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.spawnBombTargets();
window.__FENGYUN_GAME__.advanceWorld(0.02);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.bombInterval, 1.55);
assert.equal(window.__FENGYUN_GAME__.snapshot().airstrikes.active, 1);
assert.equal(window.__FENGYUN_GAME__.snapshot().airstrikes.pending, 1);
window.__FENGYUN_GAME__.advanceWorld(0.35);
assert.equal(window.__FENGYUN_GAME__.snapshot().airstrikes.detonated, 1);
assert.ok(window.__FENGYUN_GAME__.snapshot().enemies < 3);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.spawnSingleBombTarget();
window.__FENGYUN_GAME__.grantAmplifiers(1);
window.__FENGYUN_GAME__.activateAmplifier();
window.__FENGYUN_GAME__.advanceWorld(0.02);
assert.equal(window.__FENGYUN_GAME__.snapshot().airstrikes.active, 2);
assert.equal(window.__FENGYUN_GAME__.snapshot().airstrikes.pending, 2);
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.skipToBoss();
window.__FENGYUN_GAME__.advanceWorld(3);
const bossHpBeforeBombing = window.__FENGYUN_GAME__.snapshot().boss.hp;
window.__FENGYUN_GAME__.advanceWorld(2);
assert.ok(window.__FENGYUN_GAME__.snapshot().boss.hp < bossHpBeforeBombing);

console.log("Twelve-level campaign, endless mode, and four-fighter selection smoke tests passed.");
