(() => {
  "use strict";

  window.FY.BALANCE = Object.freeze({
    pulse: Object.freeze({
      damage: 14,
      boostedDamage: 17,
      speed: 535,
      interval: 0.13,
      burstInterval: 0.075,
      overdriveInterval: 0.085,
    }),
    laser: Object.freeze({
      damagePerSecond: 260,
      boostedDamagePerSecond: 340,
      heatPerSecond: 24,
      coolingPerSecond: 60,
      resumeHeat: 20,
    }),
    dual: Object.freeze({
      damage: 18,
      boostedDamage: 22,
      speed: 760,
      boostedSpeed: 860,
      length: 32,
      boostedLength: 40,
      interval: 0.18,
      boostedInterval: 0.12,
    }),
    bomber: Object.freeze({
      damage: 240,
      boostedDamage: 330,
      radius: 58,
      boostedRadius: 66,
      interval: 1.55,
      boostedInterval: 1,
      lockDelay: 0.3,
      edgeDamageRatio: 0.62,
    }),
  });
})();
