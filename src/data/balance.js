(() => {
  "use strict";

  const BALANCE = Object.freeze({
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
    amplifier: Object.freeze({
      maxCharges: 3,
      duration: 7,
      maxDuration: 14,
      weaponCopies: 2,
    }),
  });

  const GROWTH = Object.freeze({
    maxRank: 4,
    attributes: Object.freeze({
      damage: Object.freeze({
        name: "火力校准",
        description: "所有战机武器伤害",
        perPoint: 0.04,
        display: "+4%",
      }),
      shield: Object.freeze({
        name: "护盾扩容",
        description: "护盾上限",
        perPoint: 8,
        display: "+8",
      }),
      regen: Object.freeze({
        name: "自愈回路",
        description: "护盾自动恢复速度",
        perPoint: 0.1,
        display: "+10%",
      }),
      speed: Object.freeze({
        name: "矢量推进",
        description: "战机移动速度",
        perPoint: 0.025,
        display: "+2.5%",
      }),
      energy: Object.freeze({
        name: "天候共振",
        description: "击破与擦弹获得的气象能量",
        perPoint: 0.05,
        display: "+5%",
      }),
    }),
  });

  const CAMPAIGN_DIFFICULTY = Object.freeze({
    1: Object.freeze({ hpScale: 1, bulletSpeedScale: 1, fireRateScale: 1, bossHpScale: 1 }),
    2: Object.freeze({ hpScale: 1.04, bulletSpeedScale: 1.01, fireRateScale: 1.015, bossHpScale: 1.02 }),
    3: Object.freeze({ hpScale: 1.08, bulletSpeedScale: 1.02, fireRateScale: 1.03, bossHpScale: 1.04 }),
    4: Object.freeze({ hpScale: 1.12, bulletSpeedScale: 1.03, fireRateScale: 1.045, bossHpScale: 1.06 }),
    5: Object.freeze({ hpScale: 1.17, bulletSpeedScale: 1.04, fireRateScale: 1.06, bossHpScale: 1.08 }),
    6: Object.freeze({ hpScale: 1.22, bulletSpeedScale: 1.05, fireRateScale: 1.075, bossHpScale: 1.1 }),
    7: Object.freeze({ hpScale: 1.27, bulletSpeedScale: 1.06, fireRateScale: 1.09, bossHpScale: 1.11 }),
    8: Object.freeze({ hpScale: 1.32, bulletSpeedScale: 1.07, fireRateScale: 1.105, bossHpScale: 1.12 }),
    9: Object.freeze({ hpScale: 1.38, bulletSpeedScale: 1.08, fireRateScale: 1.12, bossHpScale: 1.13 }),
    10: Object.freeze({ hpScale: 1.44, bulletSpeedScale: 1.09, fireRateScale: 1.135, bossHpScale: 1.15 }),
    11: Object.freeze({ hpScale: 1.5, bulletSpeedScale: 1.1, fireRateScale: 1.15, bossHpScale: 1.16 }),
    12: Object.freeze({ hpScale: 1.56, bulletSpeedScale: 1.11, fireRateScale: 1.165, bossHpScale: 1.16 }),
  });

  Object.assign(window.FY, { BALANCE, GROWTH, CAMPAIGN_DIFFICULTY });
})();
