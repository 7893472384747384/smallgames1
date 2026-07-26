(() => {
  "use strict";

  const FY = window.FY;
const game = new FY.Game();
  window.__FENGYUN_GAME__ = {
    snapshot: () => game.getSnapshot(),
    start: (level = 1) => game.start(level),
    startLevelTwo: () => game.start(2),
    startLevelThree: () => game.start(3),
    startLevelFour: () => game.start(4),
    startLevelFive: () => game.start(5),
    startLevelSix: () => game.start(6),
    startEndless: () => game.startEndless(),
    selectFighter: (fighterId) => game.selectFighter(fighterId),
    returnToHangar: () => game.returnToHangar(),
    pause: () => {
      game.pause();
      return game.getSnapshot();
    },
    chooseEndlessUpgrade: (index = 0) => {
      game.chooseEndlessUpgrade(index);
      return game.getSnapshot();
    },
    advanceEndless: (seconds = 0) => game.debugAdvanceEndless(seconds),
    advanceWorld: (seconds = 0) => game.debugAdvanceWorld(seconds),
    endEndless: () => {
      if (game.mode === "endless" && game.state === "playing") game.finish(false);
      return game.getSnapshot();
    },
    skipToBoss: () => game.debugSkipToBoss(),
    spawnPickups: () => game.debugSpawnPickups(),
    grantAmplifiers: (count = 1) => {
      game.player.amplifierCharges = Math.min(
        FY.BALANCE.amplifier.maxCharges,
        game.player.amplifierCharges + Math.max(0, Math.floor(Number(count) || 0)),
      );
      return game.getSnapshot();
    },
    activateAmplifier: () => {
      game.activateAmplifier();
      return game.getSnapshot();
    },
    spawnBombTargets: () => {
      game.enemies.length = 0;
      game.spawnEnemy("scout", 200, 180, { phase: 0 });
      game.spawnEnemy("scout", 225, 190, { phase: 0.4 });
      game.spawnEnemy("scout", 250, 180, { phase: 0.8 });
      game.player.bombTimer = 0;
      return game.getSnapshot();
    },
    spawnSingleBombTarget: () => {
      game.enemies.length = 0;
      game.spawnEnemy("sweeper", 225, 180, { phase: 0 });
      game.player.bombTimer = 0;
      return game.getSnapshot();
    },
    chargeBurst: () => {
      game.player.energy = 100;
    },
    damageBoss: (amount = 500) => {
      if (game.boss) game.boss.hp -= Math.max(0, Number(amount) || 0);
    },
    damageBossPart: (id = "left", amount = 9999) => {
      const part = game.boss?.parts?.find((candidate) => candidate.id === id);
      if (part) game.damageBossPart(part, Math.max(0, Number(amount) || 0));
      return game.getSnapshot();
    },
    spawnFunctionalEnemies: () => {
      game.enemies.length = 0;
      ["guardian", "medic", "minelayer", "carrier"].forEach((type, index) => {
        game.spawnEnemy(type, 90 + index * 90, 120, { phase: index });
      });
      return game.getSnapshot();
    },
    getCampaignRating: () => game.calculateCampaignRating(),
  };
})();
