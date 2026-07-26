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
window.__FENGYUN_GAME__.skipToBoss();
const bossHpBeforeLaser = window.__FENGYUN_GAME__.snapshot().boss.hp;
window.__FENGYUN_GAME__.advanceWorld(3.5);
assert.ok(window.__FENGYUN_GAME__.snapshot().boss.hp < bossHpBeforeLaser);

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
  { kind: "gale", hp: 2900, weather: "galeBoss" },
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
  { kind: "volt", hp: 3200, weather: "voltBoss" },
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
  { kind: "tide", hp: 3550, weather: "tideBoss" },
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
  { kind: "ridge", hp: 3900, weather: "ridgeBoss" },
);
window.__FENGYUN_GAME__.advanceWorld(1.35);
assert.ok(window.__FENGYUN_GAME__.snapshot().hazards.rockfalls > 0);

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
assert.ok(JSON.parse(storedSave).bestEndlessTime >= 65);
assert.ok(JSON.parse(storedSave).bestEndlessScore > 0);
window.__FENGYUN_GAME__.returnToHangar();
window.__FENGYUN_GAME__.selectFighter("pulse");
window.__FENGYUN_GAME__.start(1);
window.__FENGYUN_GAME__.advanceWorld(0.2);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.id, "pulse");
assert.ok(window.__FENGYUN_GAME__.snapshot().playerBullets > 0);
assert.equal(window.__FENGYUN_GAME__.snapshot().fighter.laserHeat, 0);

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
window.__FENGYUN_GAME__.skipToBoss();
window.__FENGYUN_GAME__.advanceWorld(3);
const bossHpBeforeBombing = window.__FENGYUN_GAME__.snapshot().boss.hp;
window.__FENGYUN_GAME__.advanceWorld(2);
assert.ok(window.__FENGYUN_GAME__.snapshot().boss.hp < bossHpBeforeBombing);

console.log("Six-level campaign, endless mode, and four-fighter selection smoke tests passed.");
