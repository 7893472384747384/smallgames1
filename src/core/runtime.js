(() => {
"use strict";

  const WIDTH = 450;
  const HEIGHT = 800;
  const TAU = Math.PI * 2;
  const STORAGE_KEY = "fengyun-fighter-save-v1";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const loadSprite = (source) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return image;
  };
  const sprites = {
    player: loadSprite("assets/ships/player-interceptor-game.png"),
    playerLaser: loadSprite("assets/ships/player-laser-game.png"),
    playerDual: loadSprite("assets/ships/player-red-dual-game.png"),
    playerBomber: loadSprite("assets/ships/player-bomber-purple-game.png"),
    boss: loadSprite("assets/ships/boss-yubo-game.png"),
    bossMirage: loadSprite("assets/ships/boss-mirage-game.png"),
    bossGale: loadSprite("assets/ships/boss-gale-game.png"),
    bossVolt: loadSprite("assets/ships/boss-volt-game.png"),
    bossTide: loadSprite("assets/ships/boss-tide-game.png"),
    bossRidge: loadSprite("assets/ships/boss-ridge-game.png"),
    bossChiji: loadSprite("assets/ships/boss-chiji-game.png"),
    bossKuilong: loadSprite("assets/ships/boss-kuilong-game.png"),
    scout: loadSprite("assets/ships/enemy-scout-game.png"),
    sweeper: loadSprite("assets/ships/enemy-sweeper-game.png"),
    charger: loadSprite("assets/ships/enemy-charger-game.png"),
  };

  const ui = {
    startPanel: document.getElementById("startPanel"),
    pausePanel: document.getElementById("pausePanel"),
    settingsPanel: document.getElementById("settingsPanel"),
    resultPanel: document.getElementById("resultPanel"),
    upgradePanel: document.getElementById("upgradePanel"),
    upgradeButtons: [0, 1, 2].map((index) => document.getElementById(`upgradeButton${index}`)),
    returnToHangarFromUpgradeButton: document.getElementById("returnToHangarFromUpgradeButton"),
    startButton: document.getElementById("startButton"),
    endlessButton: document.getElementById("endlessButton"),
    fighterSelector: document.getElementById("fighterSelector"),
    fighterButtons: {},
    growthPanel: document.getElementById("growthPanel"),
    growthList: document.getElementById("growthList"),
    growthAvailable: document.getElementById("growthAvailable"),
    growthSummary: document.getElementById("growthSummary"),
    growthResetButton: document.getElementById("growthResetButton"),
    growthButtons: {},
    growthRanks: {},
    levelShortcuts: document.getElementById("levelShortcuts"),
    levelButtons: {},
    pauseButton: document.getElementById("pauseButton"),
    resumeButton: document.getElementById("resumeButton"),
    restartFromPauseButton: document.getElementById("restartFromPauseButton"),
    returnToHangarFromPauseButton: document.getElementById("returnToHangarFromPauseButton"),
    replayButton: document.getElementById("replayButton"),
    returnToHangarButton: document.getElementById("returnToHangarButton"),
    soundButton: document.getElementById("soundButton"),
    settingsButton: document.getElementById("settingsButton"),
    closeSettingsButton: document.getElementById("closeSettingsButton"),
    shieldValueToggle: document.getElementById("shieldValueToggle"),
    burstButton: document.getElementById("burstButton"),
    amplifierButton: document.getElementById("amplifierButton"),
    amplifierCount: document.getElementById("amplifierCount"),
    bestScoreLabel: document.getElementById("bestScoreLabel"),
    endlessBestLabel: document.getElementById("endlessBestLabel"),
    resultKicker: document.getElementById("resultKicker"),
    resultRank: document.getElementById("resultRank"),
    resultTitle: document.getElementById("resultTitle"),
    finalScore: document.getElementById("finalScore"),
    finalScoreLabel: document.getElementById("finalScoreLabel"),
    finalCombo: document.getElementById("finalCombo"),
    finalComboLabel: document.getElementById("finalComboLabel"),
    finalGraze: document.getElementById("finalGraze"),
    finalGrazeLabel: document.getElementById("finalGrazeLabel"),
    resultMessage: document.getElementById("resultMessage"),
    levelKicker: document.getElementById("levelKicker"),
    levelTitle: document.getElementById("levelTitle"),
    missionCopy: document.getElementById("missionCopy"),
    statusLevel: document.getElementById("statusLevel"),
    debugControls: document.getElementById("debugControls"),
    debugEndlessButton: document.getElementById("debugEndlessButton"),
    debugLevelTwoButton: document.getElementById("debugLevelTwoButton"),
    debugLevelThreeButton: document.getElementById("debugLevelThreeButton"),
    debugLevelFourButton: document.getElementById("debugLevelFourButton"),
    debugLevelFiveButton: document.getElementById("debugLevelFiveButton"),
    debugLevelSixButton: document.getElementById("debugLevelSixButton"),
    debugLevelSevenButton: document.getElementById("debugLevelSevenButton"),
    debugLevelEightButton: document.getElementById("debugLevelEightButton"),
    debugBossButton: document.getElementById("debugBossButton"),
    debugDamageButton: document.getElementById("debugDamageButton"),
    debugDropButton: document.getElementById("debugDropButton"),
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const random = (min, max) => min + Math.random() * (max - min);
  const distanceSquared = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };
  const formatScore = (score) => String(Math.max(0, Math.floor(score))).padStart(6, "0");
  const formatTime = (seconds) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  };






  const FY = window.FY || (window.FY = { mixins: {} });
  FY.mixins ||= {};
  Object.assign(FY, {
    WIDTH,
    HEIGHT,
    TAU,
    STORAGE_KEY,
    canvas,
    ctx,
    sprites,
    ui,
    clamp,
    lerp,
    random,
    distanceSquared,
    formatScore,
    formatTime,
  });
})();
