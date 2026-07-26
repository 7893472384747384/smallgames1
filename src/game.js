(() => {
  "use strict";

  const WIDTH = 450;
  const HEIGHT = 800;
  const TAU = Math.PI * 2;
  const STORAGE_KEY = "fengyun-fighter-save-v1";
  const ENVIRONMENTS = [
    "skyCity",
    "cloudSea",
    "windCorridor",
    "powerGrid",
    "thunderCanyon",
    "sandstorm",
    "polarNight",
    "orbitalRuins",
  ];
  const LEVELS = {
    1: {
      code: "F-01",
      kicker: "第一章 · 01",
      title: "晴空防线",
      environment: "skyCity",
      mission: "天候核心出现异常，积雨云母舰正逼近浮空城。穿越雷区，在风暴成形前将其击落。",
      clearTitle: "风暴已平息",
    },
    2: {
      code: "F-02",
      kicker: "第一章 · 02",
      title: "云海追猎",
      environment: "cloudSea",
      mission: "敌方巡猎舰潜入云海。利用云隙识别伏击编队，摆脱锁定并击破隐云母舰“蜃影”。",
      clearTitle: "云幕已突破",
    },
    3: {
      code: "F-03",
      kicker: "第一章 · 03",
      title: "风塔回廊",
      environment: "windCorridor",
      mission: "风塔群被敌军接管，航道正在周期性收束。观察两侧风压预警，穿过安全回廊并摧毁风塔守卫。",
      clearTitle: "回廊已贯通",
    },
    4: {
      code: "F-04",
      kicker: "第一章 · 04",
      title: "电网边境",
      environment: "powerGrid",
      mission: "边境电网失控，纵横电弧会同时伤害敌我。诱导敌机进入导电区，击破控制电网的裁决舰。",
      clearTitle: "电网已解放",
    },
  };
  const ENDLESS_ENVIRONMENTS = [
    "skyCity",
    "cloudSea",
    "windCorridor",
    "powerGrid",
    "thunderCanyon",
    "sandstorm",
    "polarNight",
    "orbitalRuins",
  ];
  const ENDLESS_BOSSES = ["yubo", "mirage", "gale", "volt"];
  const FIGHTERS = {
    pulse: {
      name: "苍隼",
      weapon: "双联脉冲光弹",
      sprite: "player",
    },
    laser: {
      name: "曜光",
      weapon: "持续聚束激光",
      sprite: "playerLaser",
    },
    dual: {
      name: "赤霄",
      weapon: "高频双短束激光",
      sprite: "playerDual",
    },
    bomber: {
      name: "紫宸",
      weapon: "自动区域轰炸",
      sprite: "playerBomber",
    },
  };

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
    scout: loadSprite("assets/ships/enemy-scout-game.png"),
    sweeper: loadSprite("assets/ships/enemy-sweeper-game.png"),
    charger: loadSprite("assets/ships/enemy-charger-game.png"),
  };

  const ui = {
    startPanel: document.getElementById("startPanel"),
    pausePanel: document.getElementById("pausePanel"),
    settingsPanel: document.getElementById("settingsPanel"),
    resultPanel: document.getElementById("resultPanel"),
    startButton: document.getElementById("startButton"),
    endlessButton: document.getElementById("endlessButton"),
    fighterPulseButton: document.getElementById("fighterPulseButton"),
    fighterLaserButton: document.getElementById("fighterLaserButton"),
    fighterDualButton: document.getElementById("fighterDualButton"),
    fighterBomberButton: document.getElementById("fighterBomberButton"),
    secondLevelButton: document.getElementById("secondLevelButton"),
    thirdLevelButton: document.getElementById("thirdLevelButton"),
    fourthLevelButton: document.getElementById("fourthLevelButton"),
    pauseButton: document.getElementById("pauseButton"),
    resumeButton: document.getElementById("resumeButton"),
    restartFromPauseButton: document.getElementById("restartFromPauseButton"),
    replayButton: document.getElementById("replayButton"),
    returnToHangarButton: document.getElementById("returnToHangarButton"),
    soundButton: document.getElementById("soundButton"),
    settingsButton: document.getElementById("settingsButton"),
    closeSettingsButton: document.getElementById("closeSettingsButton"),
    shieldValueToggle: document.getElementById("shieldValueToggle"),
    burstButton: document.getElementById("burstButton"),
    bestScoreLabel: document.getElementById("bestScoreLabel"),
    endlessBestLabel: document.getElementById("endlessBestLabel"),
    resultKicker: document.getElementById("resultKicker"),
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

  function loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        bestScore: Number.isFinite(data.bestScore) ? data.bestScore : 0,
        bestEndlessScore: Number.isFinite(data.bestEndlessScore) ? data.bestEndlessScore : 0,
        bestEndlessTime: Number.isFinite(data.bestEndlessTime) ? data.bestEndlessTime : 0,
        selectedFighter: FIGHTERS[data.selectedFighter] ? data.selectedFighter : "pulse",
        sound: data.sound !== false,
        showShieldValue: data.showShieldValue !== false,
        unlockedLevel: clamp(Math.floor(Number(data.unlockedLevel) || 1), 1, 4),
      };
    } catch {
      return {
        bestScore: 0,
        bestEndlessScore: 0,
        bestEndlessTime: 0,
        selectedFighter: "pulse",
        sound: true,
        showShieldValue: true,
        unlockedLevel: 1,
      };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  class SynthAudio {
    constructor(enabled) {
      this.enabled = enabled;
      this.context = null;
      this.lastShotAt = 0;
    }

    unlock() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      }
      if (this.context?.state === "suspended") this.context.resume();
    }

    tone(frequency, duration, type = "sine", volume = 0.035, glide = 0) {
      if (!this.enabled || !this.context) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (glide) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(30, frequency + glide),
          now + duration,
        );
      }
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    shot() {
      const now = performance.now();
      if (now - this.lastShotAt < 95) return;
      this.lastShotAt = now;
      this.tone(520, 0.045, "square", 0.012, 190);
    }

    enemyShot() {
      this.tone(180, 0.08, "sawtooth", 0.009, -50);
    }

    hit() {
      this.tone(90, 0.16, "sawtooth", 0.055, -40);
    }

    explosion(size = 1) {
      this.tone(120 / size, 0.12 + size * 0.05, "square", 0.025, -70);
    }

    graze() {
      this.tone(860, 0.035, "sine", 0.012, 120);
    }

    burst() {
      this.tone(145, 0.65, "sawtooth", 0.05, 750);
      setTimeout(() => this.tone(420, 0.4, "sine", 0.035, 400), 80);
    }

    lightning() {
      this.tone(70, 0.22, "square", 0.04, -25);
    }

    victory() {
      [330, 440, 554, 660].forEach((frequency, index) => {
        setTimeout(() => this.tone(frequency, 0.25, "triangle", 0.035, 80), index * 115);
      });
    }
  }

  class Game {
    constructor() {
      this.save = loadSave();
      this.audio = new SynthAudio(this.save.sound);
      this.state = "menu";
      this.mode = "campaign";
      this.fighterId = this.save.selectedFighter;
      this.lastFrame = performance.now();
      this.ambientTime = 0;
      this.keys = new Set();
      this.pointerActive = false;
      this.pointerTarget = { x: WIDTH / 2, y: HEIGHT - 120 };
      const parameters = new URLSearchParams(window.location.search);
      this.level = clamp(Math.floor(Number(parameters.get("level")) || 1), 1, 4);
      const requestedEnvironment = parameters.get("environment");
      this.environment = ENVIRONMENTS.includes(requestedEnvironment)
        ? requestedEnvironment
        : LEVELS[this.level].environment;
      this.environmentOverride = ENVIRONMENTS.includes(requestedEnvironment);
      this.settingsReturnState = "menu";
      this.stars = Array.from({ length: 90 }, () => ({
        x: random(0, WIDTH),
        y: random(0, HEIGHT),
        size: random(0.4, 2),
        speed: random(12, 90),
        alpha: random(0.2, 0.9),
      }));
      this.clouds = Array.from({ length: 12 }, () => ({
        x: random(-120, WIDTH),
        y: random(-100, HEIGHT),
        radius: random(35, 90),
        speed: random(8, 23),
        alpha: random(0.025, 0.09),
      }));
      this.bindEvents();
      this.resetWorld();
      this.updatePersistentUI();
      requestAnimationFrame((time) => this.loop(time));
    }

    bindEvents() {
      ui.startButton.addEventListener("click", () => this.start(this.level));
      ui.endlessButton.addEventListener("click", () => this.startEndless());
      ui.fighterPulseButton.addEventListener("click", () => this.selectFighter("pulse"));
      ui.fighterLaserButton.addEventListener("click", () => this.selectFighter("laser"));
      ui.fighterDualButton.addEventListener("click", () => this.selectFighter("dual"));
      ui.fighterBomberButton.addEventListener("click", () => this.selectFighter("bomber"));
      ui.secondLevelButton.addEventListener("click", () => this.start(2));
      ui.thirdLevelButton.addEventListener("click", () => this.start(3));
      ui.fourthLevelButton.addEventListener("click", () => this.start(4));
      ui.replayButton.addEventListener("click", () => this.handleResultAction());
      ui.returnToHangarButton.addEventListener("click", () => this.returnToHangar());
      ui.resumeButton.addEventListener("click", () => this.resume());
      ui.restartFromPauseButton.addEventListener("click", () => this.restartCurrent());
      ui.pauseButton.addEventListener("click", () => this.togglePause());
      ui.soundButton.addEventListener("click", () => this.toggleSound());
      ui.settingsButton.addEventListener("click", () => this.openSettings());
      ui.closeSettingsButton.addEventListener("click", () => this.closeSettings());
      ui.shieldValueToggle.addEventListener("change", () => {
        this.save.showShieldValue = ui.shieldValueToggle.checked;
        saveData(this.save);
      });
      ui.burstButton.addEventListener("click", () => {
        this.audio.unlock();
        this.activateBurst();
      });
      if (new URLSearchParams(window.location.search).has("debug")) {
        ui.debugControls.hidden = false;
        ui.debugEndlessButton.addEventListener("click", () => this.startEndless());
        ui.debugLevelTwoButton.addEventListener("click", () => this.start(2));
        ui.debugLevelThreeButton.addEventListener("click", () => this.start(3));
        ui.debugLevelFourButton.addEventListener("click", () => this.start(4));
        ui.debugBossButton.addEventListener("click", () => this.debugSkipToBoss());
        ui.debugDamageButton.addEventListener("click", () => {
          if (this.boss) this.boss.hp -= 740;
        });
        ui.debugDropButton?.addEventListener("click", () => this.debugSpawnPickups());
      }

      canvas.addEventListener("pointerdown", (event) => {
        if (this.state !== "playing") return;
        this.audio.unlock();
        this.pointerActive = true;
        canvas.setPointerCapture?.(event.pointerId);
        this.updatePointer(event);
      });
      canvas.addEventListener("pointermove", (event) => {
        if (this.pointerActive) this.updatePointer(event);
      });
      canvas.addEventListener("pointerup", (event) => {
        this.pointerActive = false;
        canvas.releasePointerCapture?.(event.pointerId);
      });
      canvas.addEventListener("pointercancel", () => {
        this.pointerActive = false;
      });

      window.addEventListener("keydown", (event) => {
        const controlled = [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "Space",
          "Escape",
        ];
        if (controlled.includes(event.code)) event.preventDefault();
        if (event.code === "Space" && !event.repeat) {
          this.audio.unlock();
          this.activateBurst();
        } else if (event.code === "Escape" && !event.repeat) {
          this.togglePause();
        }
        this.keys.add(event.code);
      });
      window.addEventListener("keyup", (event) => this.keys.delete(event.code));
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.state === "playing") this.pause();
      });
    }

    updatePointer(event) {
      const bounds = canvas.getBoundingClientRect();
      this.pointerTarget.x = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
      this.pointerTarget.y = ((event.clientY - bounds.top) / bounds.height) * HEIGHT;
    }

    resetWorld() {
      this.time = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.comboTimer = 0;
      this.grazeCount = 0;
      this.shake = 0;
      this.screenFlash = 0;
      this.banner = null;
      this.waveIndex = 0;
      this.boss = null;
      this.enemies = [];
      this.playerBullets = [];
      this.enemyBullets = [];
      this.pickups = [];
      this.particles = [];
      this.lightningZones = [];
      this.lockThreat = null;
      this.corridorGate = null;
      this.gridHazards = [];
      this.airstrikes = [];
      this.pickupNotice = null;
      this.endless = {
        pressure: 1,
        sector: 1,
        bossesDefeated: 0,
        nextWave: 2.2,
        nextWeather: 14,
        nextBoss: 75,
        restUntil: 0,
      };
      const calmWeather = {
        1: "高空晴朗",
        2: "云海静流",
        3: "回廊顺风",
        4: "电网待机",
      };
      this.weather = {
        label: this.mode === "endless" ? "风暴边缘" : calmWeather[this.level],
        type: "clear",
        timer: 999,
        wind: 0,
        targetWind: 0,
        nextShift: 0,
        nextLightning: 999,
        nextLock: 999,
        nextCorridor: 999,
        nextGrid: 999,
      };
      this.player = {
        x: WIDTH / 2,
        y: HEIGHT - 115,
        radius: 9,
        speed: 280,
        shield: 100,
        hull: 3,
        energy: 0,
        fireTimer: 0,
        invincible: 3.2,
        sinceHit: 99,
        burstTimer: 0,
        overdriveTimer: 0,
        laserHeat: 0,
        laserCooling: false,
        laserActive: false,
        laserEndY: 0,
        laserSparkTimer: 0,
        laserAudioTimer: 0,
        dualLaserActive: false,
        dualLaserFireTimer: 0,
        dualLaserCooldown: 0,
        bombTimer: 0.55,
        bombInterval: 1.55,
        tilt: 0,
      };
      this.pointerTarget.x = this.player.x;
      this.pointerTarget.y = this.player.y;
      if (!this.environmentOverride) {
        this.environment =
          this.mode === "endless" ? ENDLESS_ENVIRONMENTS[0] : LEVELS[this.level].environment;
      }
      this.waves = this.buildWaves();
      this.updateLevelUI();
      ui.burstButton.classList.remove("ready");
    }

    buildWaves() {
      if (this.mode === "endless") return [];
      if (this.level === 2) return this.buildLevelTwoWaves();
      if (this.level === 3) return this.buildLevelThreeWaves();
      if (this.level === 4) return this.buildLevelFourWaves();
      return this.buildLevelOneWaves();
    }

    buildLevelOneWaves() {
      return [
        { at: 0.5, run: () => this.showBanner("F-01 晴空防线", "正在进入天候异常区域", 3.2) },
        { at: 2.5, run: () => this.spawnScoutV(5) },
        { at: 7, run: () => this.spawnScoutColumns() },
        {
          at: 11,
          run: () => {
            this.setWeather("wind", 11, "东向急流");
            this.showBanner("强风警告", "顺势移动，避免被推入弹幕", 2.6);
          },
        },
        { at: 12, run: () => this.spawnSweepers(3) },
        { at: 17.5, run: () => this.spawnChargers(2) },
        { at: 21.5, run: () => this.spawnMixedWave() },
        {
          at: 27,
          run: () => {
            this.setWeather("thunder", 13, "雷云活跃");
            this.showBanner("落雷预警", "警戒区也会伤害敌机", 2.6);
          },
        },
        { at: 28, run: () => this.spawnScoutV(7) },
        { at: 33, run: () => this.spawnSweepers(4) },
        { at: 38.5, run: () => this.spawnChargers(3) },
        {
          at: 42,
          run: () => {
            this.setWeather("storm", 14, "复合风暴");
            this.spawnMixedWave();
          },
        },
        { at: 47, run: () => this.spawnScoutColumns(true) },
        { at: 52, run: () => this.spawnSweepers(5) },
        { at: 57, run: () => this.spawnChargers(4) },
        {
          at: 62.5,
          run: () => {
            this.setWeather("eye", 6, "风眼静默");
            this.showBanner("风眼开启", "弹幕暂时减速，准备迎敌", 3);
            this.enemyBullets.forEach((bullet) => {
              bullet.vx *= 0.45;
              bullet.vy *= 0.45;
            });
          },
        },
        {
          at: 68,
          run: () => {
            this.setWeather("boss", 999, "超胞雷暴");
            this.spawnBoss();
          },
        },
      ];
    }

    buildLevelTwoWaves() {
      return [
        { at: 0.5, run: () => this.showBanner("F-02 云海追猎", "追踪信号正在云层中断续出现", 3.2) },
        { at: 2.5, run: () => this.spawnScoutV(6) },
        { at: 6.5, run: () => this.spawnSweepers(3) },
        {
          at: 10,
          run: () => {
            this.setWeather("mist", 12, "云幕遮蔽");
            this.showBanner("云幕来袭", "敌机轮廓会在浓云中短暂隐去", 2.8);
          },
        },
        { at: 11, run: () => this.spawnScoutColumns(true) },
        { at: 16, run: () => this.spawnChargers(3) },
        { at: 21, run: () => this.spawnMixedWave() },
        {
          at: 25,
          run: () => {
            this.setWeather("hunt", 14, "追猎锁定");
            this.showBanner("锁定警告", "红色准星闭合前离开标记区域", 2.8);
          },
        },
        { at: 27, run: () => this.spawnSweepers(4) },
        { at: 32, run: () => this.spawnChargers(4) },
        { at: 37, run: () => this.spawnScoutV(9) },
        {
          at: 42,
          run: () => {
            this.setWeather("jetstream", 11, "云脊急流");
            this.showBanner("云脊横流", "急流方向每数秒发生反转", 2.6);
            this.spawnMixedWave();
          },
        },
        { at: 47, run: () => this.spawnSweepers(5) },
        { at: 52, run: () => this.spawnChargers(4) },
        {
          at: 57,
          run: () => {
            this.setWeather("mirageBoss", 999, "蜃影云场");
            this.spawnBoss("mirage");
          },
        },
      ];
    }

    buildLevelThreeWaves() {
      return [
        { at: 0.5, run: () => this.showBanner("F-03 风塔回廊", "风塔叶阵正在封锁航道", 3.2) },
        { at: 2.5, run: () => this.spawnScoutColumns(true) },
        { at: 7, run: () => this.spawnSweepers(4) },
        {
          at: 11,
          run: () => {
            this.setWeather("towerWind", 12, "风塔脉冲");
            this.showBanner("横风换向", "观察流线，提前修正飞行位置", 2.7);
          },
        },
        { at: 12, run: () => this.spawnChargers(3) },
        { at: 17, run: () => this.spawnScoutV(9) },
        { at: 22, run: () => this.spawnMixedWave() },
        {
          at: 27,
          run: () => {
            this.setWeather("corridor", 15, "航道收束");
            this.showBanner("回廊预警", "留在青色安全航道内，避开两侧风压墙", 3);
          },
        },
        { at: 28, run: () => this.spawnSweepers(5) },
        { at: 33, run: () => this.spawnChargers(4) },
        { at: 38, run: () => this.spawnScoutColumns(true) },
        {
          at: 43,
          run: () => {
            this.setWeather("reverseGale", 12, "逆压回流");
            this.showBanner("风压反转", "横风与回廊交替出现", 2.6);
            this.spawnMixedWave();
          },
        },
        { at: 48, run: () => this.spawnSweepers(5) },
        { at: 53, run: () => this.spawnChargers(4) },
        {
          at: 58,
          run: () => {
            this.setWeather("galeBoss", 999, "风塔共振");
            this.spawnBoss("gale");
          },
        },
      ];
    }

    buildLevelFourWaves() {
      return [
        { at: 0.5, run: () => this.showBanner("F-04 电网边境", "边境导电阵列已经失控", 3.2) },
        { at: 2.5, run: () => this.spawnScoutV(8) },
        { at: 7, run: () => this.spawnChargers(3) },
        {
          at: 11,
          run: () => {
            this.setWeather("grid", 13, "纵向导电");
            this.showBanner("电网充能", "电弧会同时伤害敌我，利用预警线诱敌", 3);
          },
        },
        { at: 12, run: () => this.spawnSweepers(4) },
        { at: 17, run: () => this.spawnScoutColumns(true) },
        { at: 22, run: () => this.spawnMixedWave() },
        {
          at: 27,
          run: () => {
            this.setWeather("crossGrid", 15, "交叉电网");
            this.showBanner("回路闭合", "横纵电弧将依次放电，寻找网格空隙", 3);
          },
        },
        { at: 28, run: () => this.spawnChargers(4) },
        { at: 33, run: () => this.spawnSweepers(5) },
        { at: 38, run: () => this.spawnScoutV(10) },
        {
          at: 43,
          run: () => {
            this.setWeather("overload", 12, "边境过载");
            this.showBanner("连锁放电", "被击中的敌机会成为短暂导电目标", 2.8);
            this.spawnMixedWave();
          },
        },
        { at: 48, run: () => this.spawnChargers(5) },
        { at: 53, run: () => this.spawnSweepers(6) },
        {
          at: 58,
          run: () => {
            this.setWeather("voltBoss", 999, "裁决电网");
            this.spawnBoss("volt");
          },
        },
      ];
    }

    start(level = this.level) {
      this.audio.unlock();
      this.mode = "campaign";
      this.level = clamp(Math.floor(Number(level) || 1), 1, 4);
      this.resetWorld();
      this.state = "playing";
      this.hidePanels();
      this.lastFrame = performance.now();
    }

    selectFighter(fighterId) {
      if (!FIGHTERS[fighterId] || this.state !== "menu") return;
      this.fighterId = fighterId;
      this.save.selectedFighter = fighterId;
      saveData(this.save);
      this.updatePersistentUI();
    }

    startEndless() {
      this.audio.unlock();
      this.mode = "endless";
      this.level = 1;
      this.resetWorld();
      this.state = "playing";
      this.hidePanels();
      this.showBanner("∞ 无尽风暴", "每 30 秒压力提升，每 75 秒遭遇一台 BOSS", 3.8);
      this.lastFrame = performance.now();
    }

    restartCurrent() {
      if (this.mode === "endless") this.startEndless();
      else this.start(this.level);
    }

    returnToHangar() {
      this.mode = "campaign";
      this.state = "menu";
      this.resetWorld();
      this.hidePanels();
      ui.startPanel.classList.add("visible");
      this.updatePersistentUI();
    }

    handleResultAction() {
      if (this.mode === "endless") this.startEndless();
      else if (this.state === "victory" && this.level < 4) this.start(this.level + 1);
      else this.start(this.level);
    }

    updateLevelUI() {
      if (this.mode === "endless") {
        ui.levelKicker.textContent = "独立模式 · ENDLESS";
        ui.levelTitle.textContent = "无尽风暴";
        ui.missionCopy.textContent =
          "在不断强化的敌群、复合天气和周期 BOSS 中坚持更久。没有最终胜利，只有不断刷新的本地纪录。";
        ui.statusLevel.textContent = "∞ / 无尽风暴";
        document.title = "风云战机 · 无尽风暴";
        return;
      }
      const level = LEVELS[this.level];
      ui.levelKicker.textContent = level.kicker;
      ui.levelTitle.textContent = level.title;
      ui.missionCopy.textContent = level.mission;
      ui.statusLevel.textContent = `${level.code} / ${level.title}`;
      document.title = `风云战机 · ${level.title}`;
    }

    pause() {
      if (this.state !== "playing") return;
      this.state = "paused";
      ui.pausePanel.classList.add("visible");
    }

    resume() {
      if (this.state !== "paused") return;
      this.state = "playing";
      ui.pausePanel.classList.remove("visible");
      this.lastFrame = performance.now();
    }

    togglePause() {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    }

    toggleSound() {
      this.save.sound = !this.save.sound;
      this.audio.enabled = this.save.sound;
      if (this.save.sound) {
        this.audio.unlock();
        this.audio.tone(620, 0.08, "sine", 0.03, 100);
      }
      saveData(this.save);
      this.updatePersistentUI();
    }

    openSettings() {
      if (!["menu", "playing", "paused"].includes(this.state)) return;
      this.settingsReturnState = this.state;
      if (this.state === "playing") this.state = "settings";
      ui.shieldValueToggle.checked = this.save.showShieldValue;
      ui.settingsPanel.classList.add("visible");
    }

    closeSettings() {
      ui.settingsPanel.classList.remove("visible");
      if (this.state === "settings") {
        this.state = this.settingsReturnState;
        this.lastFrame = performance.now();
      }
      saveData(this.save);
    }

    hidePanels() {
      ui.startPanel.classList.remove("visible");
      ui.pausePanel.classList.remove("visible");
      ui.settingsPanel.classList.remove("visible");
      ui.resultPanel.classList.remove("visible");
    }

    updatePersistentUI() {
      ui.bestScoreLabel.textContent = formatScore(this.save.bestScore);
      ui.endlessBestLabel.textContent = formatTime(this.save.bestEndlessTime);
      ui.fighterPulseButton.classList.toggle("selected", this.fighterId === "pulse");
      ui.fighterLaserButton.classList.toggle("selected", this.fighterId === "laser");
      ui.fighterDualButton.classList.toggle("selected", this.fighterId === "dual");
      ui.fighterBomberButton.classList.toggle("selected", this.fighterId === "bomber");
      ui.fighterPulseButton.setAttribute(
        "aria-pressed",
        String(this.fighterId === "pulse"),
      );
      ui.fighterLaserButton.setAttribute(
        "aria-pressed",
        String(this.fighterId === "laser"),
      );
      ui.fighterDualButton.setAttribute(
        "aria-pressed",
        String(this.fighterId === "dual"),
      );
      ui.fighterBomberButton.setAttribute(
        "aria-pressed",
        String(this.fighterId === "bomber"),
      );
      ui.soundButton.textContent = this.save.sound ? "声" : "静";
      ui.soundButton.setAttribute("aria-label", this.save.sound ? "关闭声音" : "开启声音");
      ui.shieldValueToggle.checked = this.save.showShieldValue;
      ui.secondLevelButton.hidden = this.save.unlockedLevel < 2;
      ui.thirdLevelButton.hidden = this.save.unlockedLevel < 3;
      ui.fourthLevelButton.hidden = this.save.unlockedLevel < 4;
    }

    showBanner(title, subtitle = "", duration = 2.5) {
      this.banner = { title, subtitle, timer: duration, maxTimer: duration };
    }

    setWeather(type, duration, label) {
      this.weather.type = type;
      this.weather.timer = duration;
      this.weather.label = label;
      this.weather.nextShift = 0;
      this.weather.nextLightning = type === "thunder" || type === "storm" ? 1.6 : 999;
      this.weather.nextLock = type === "hunt" || type === "mirageBoss" ? 1.5 : 999;
      this.weather.nextCorridor =
        type === "corridor" || type === "reverseGale" || type === "galeBoss" ? 1.2 : 999;
      this.weather.nextGrid =
        type === "grid" || type === "crossGrid" || type === "overload" || type === "voltBoss"
          ? 1.2
          : 999;
      if (
        type === "wind" ||
        type === "storm" ||
        type === "jetstream" ||
        type === "towerWind" ||
        type === "reverseGale" ||
        type === "galeBoss"
      ) {
        this.weather.targetWind = random(35, 58) * (Math.random() < 0.5 ? -1 : 1);
      } else {
        this.weather.targetWind = 0;
      }
    }

    updateEndlessDirector() {
      if (this.mode !== "endless") return;
      const pressure = Math.floor(this.time / 30) + 1;
      const sector = Math.floor(this.time / 60) + 1;

      if (pressure !== this.endless.pressure) {
        this.endless.pressure = pressure;
        if (pressure % 2 === 0) {
          this.showBanner(
            `风暴压力 ${pressure}`,
            `敌机耐久 ×${this.getEndlessDifficulty().hpScale.toFixed(2)} · 弹速继续提升`,
            2.4,
          );
        }
      }

      if (sector !== this.endless.sector) {
        this.endless.sector = sector;
        if (!this.environmentOverride) {
          this.environment = ENDLESS_ENVIRONMENTS[(sector - 1) % ENDLESS_ENVIRONMENTS.length];
        }
        this.showBanner(
          `第 ${sector} 风暴区`,
          `${this.getEnvironmentName(this.environment)} · 复合天气强度提升`,
          2.8,
        );
      }

      if (!this.boss && this.time >= this.endless.nextBoss) {
        this.spawnEndlessBoss();
        return;
      }
      if (this.boss || this.time < this.endless.restUntil) return;

      if (this.time >= this.endless.nextWeather) {
        this.startEndlessWeather();
      }

      if (this.time >= this.endless.nextWave) {
        if (this.enemies.length < 25) this.spawnEndlessWave();
        const interval = Math.max(1.65, 4.4 - this.time * 0.006);
        this.endless.nextWave = this.time + interval;
      }
    }

    getEndlessDifficulty() {
      return {
        pressure: Math.floor(this.time / 30) + 1,
        hpScale: 1 + Math.min(2.4, this.time / 240),
        speedScale: 1 + Math.min(0.45, this.time / 600),
        bulletScale: 1 + Math.min(0.5, this.time / 600),
      };
    }

    getEnvironmentName(environment) {
      return {
        skyCity: "浮空城",
        cloudSea: "云海航路",
        windCorridor: "风塔回廊",
        powerGrid: "边境电网",
        thunderCanyon: "雷鸣峡谷",
        sandstorm: "沙暴遗迹",
        polarNight: "极夜极光",
        orbitalRuins: "轨道残骸",
      }[environment];
    }

    spawnEndlessWave() {
      const pressure = this.endless.pressure;
      const pattern = (Math.floor(this.time / 4) + pressure) % 5;
      if (pattern === 0) {
        this.spawnScoutV(Math.min(12, 5 + pressure));
      } else if (pattern === 1) {
        this.spawnSweepers(Math.min(7, 2 + Math.ceil(pressure / 2)));
      } else if (pattern === 2) {
        this.spawnChargers(Math.min(6, 1 + Math.ceil(pressure / 3)));
      } else if (pattern === 3) {
        this.spawnScoutColumns(pressure >= 3);
      } else {
        this.spawnMixedWave();
      }

      if (pressure >= 6 && pattern % 2 === 0 && this.enemies.length < 20) {
        this.spawnEnemy("sweeper", random(65, WIDTH - 65), -70, {
          phase: this.time,
          hpScale: 1.15,
        });
      }
    }

    startEndlessWeather() {
      const pressure = this.endless.pressure;
      const early = [
        ["wind", 10, "游移横风"],
        ["mist", 10, "低空云幕"],
      ];
      const middle = [
        ["thunder", 11, "活跃雷区"],
        ["hunt", 11, "追猎锁定"],
        ["towerWind", 11, "风塔脉冲"],
        ["grid", 11, "纵向电网"],
      ];
      const late = [
        ["storm", 12, "复合雷暴"],
        ["jetstream", 11, "高速急流"],
        ["corridor", 12, "航道收束"],
        ["crossGrid", 12, "交叉电网"],
        ["reverseGale", 12, "逆压回流"],
        ["overload", 12, "边境过载"],
      ];
      const pool = pressure < 3 ? early : pressure < 6 ? middle : late;
      const event = pool[(Math.floor(this.time / 11) + pressure) % pool.length];
      this.setWeather(event[0], event[1], event[2]);
      this.endless.nextWeather = this.time + Math.max(9, 17 - pressure * 0.35);
    }

    spawnEndlessBoss() {
      const index = this.endless.bossesDefeated % ENDLESS_BOSSES.length;
      const kind = ENDLESS_BOSSES[index];
      const weather = {
        yubo: ["boss", "超胞雷暴"],
        mirage: ["mirageBoss", "蜃影云场"],
        gale: ["galeBoss", "风塔共振"],
        volt: ["voltBoss", "裁决电网"],
      }[kind];
      this.setWeather(weather[0], 999, weather[1]);
      this.spawnBoss(kind);
      const hpScale = 1 + Math.min(2.5, this.time / 300);
      this.boss.hp = Math.round(this.boss.hp * hpScale);
      this.boss.maxHp = this.boss.hp;
      this.endless.nextBoss = Number.POSITIVE_INFINITY;
      const bossName = {
        yubo: "雨伯",
        mirage: "蜃影",
        gale: "罡虎机",
        volt: "雷狱",
      }[kind];
      this.showBanner(
        `无尽 BOSS · ${bossName}`,
        `第 ${this.endless.bossesDefeated + 1} 轮 · 生命倍率 ×${hpScale.toFixed(2)}`,
        3.4,
      );
    }

    spawnScoutV(count) {
      for (let i = 0; i < count; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        const rank = Math.ceil(i / 2);
        this.spawnEnemy("scout", WIDTH / 2 + side * rank * 52, -35 - rank * 32, {
          phase: i * 0.45,
        });
      }
    }

    spawnScoutColumns(reinforced = false) {
      [72, WIDTH - 72].forEach((x, column) => {
        for (let i = 0; i < (reinforced ? 4 : 3); i += 1) {
          this.spawnEnemy("scout", x, -35 - i * 72 - column * 25, {
            phase: i + column,
            hpScale: reinforced ? 1.3 : 1,
          });
        }
      });
    }

    spawnSweepers(count) {
      for (let i = 0; i < count; i += 1) {
        this.spawnEnemy("sweeper", 55 + (i * (WIDTH - 110)) / Math.max(1, count - 1), -45 - i * 30, {
          phase: i * 0.9,
        });
      }
    }

    spawnChargers(count) {
      for (let i = 0; i < count; i += 1) {
        this.spawnEnemy("charger", 70 + (i * (WIDTH - 140)) / Math.max(1, count - 1), -55 - i * 62, {
          phase: i * 0.55,
        });
      }
    }

    spawnMixedWave() {
      this.spawnEnemy("sweeper", 82, -45, { phase: 0.2 });
      this.spawnEnemy("sweeper", WIDTH - 82, -75, { phase: 1.1 });
      this.spawnEnemy("charger", WIDTH / 2, -120, { phase: 0.6 });
      for (let i = 0; i < 4; i += 1) {
        this.spawnEnemy("scout", 60 + i * 110, -180 - i * 35, { phase: i });
      }
    }

    spawnEnemy(type, x, y, options = {}) {
      const stats = {
        scout: { radius: 15, hp: 32, speed: 72, score: 120, fireRate: 1.8 },
        sweeper: { radius: 20, hp: 70, speed: 52, score: 250, fireRate: 2.15 },
        charger: { radius: 18, hp: 92, speed: 46, score: 340, fireRate: 3.1 },
      }[type];
      const difficulty =
        this.mode === "endless"
          ? this.getEndlessDifficulty()
          : { hpScale: 1, speedScale: 1 };
      const hp = stats.hp * (options.hpScale || 1) * difficulty.hpScale;
      const fireRateScale =
        this.mode === "endless" ? 1 + Math.min(0.4, this.time / 600) : 1;
      this.enemies.push({
        type,
        x,
        y,
        originX: x,
        radius: stats.radius,
        hp,
        maxHp: hp,
        speed: stats.speed * difficulty.speedScale,
        score: Math.round(stats.score * (1 + (difficulty.hpScale - 1) * 0.55)),
        fireRate: stats.fireRate / fireRateScale,
        fireTimer: random(0.8, stats.fireRate / fireRateScale),
        age: 0,
        phase: options.phase || 0,
        state: "enter",
        stateTimer: 0,
        flash: 0,
      });
    }

    spawnBoss(kind = { 1: "yubo", 2: "mirage", 3: "gale", 4: "volt" }[this.level]) {
      this.enemies.length = 0;
      this.enemyBullets.length = 0;
      const stats = {
        yubo: {
          radius: 58,
          hp: 2100,
          summonTimer: 5.5,
          intro: "大型天候兵器接近",
          name: "积雨云母舰 · 雨伯",
        },
        mirage: {
          radius: 62,
          hp: 2600,
          summonTimer: 4.8,
          intro: "隐云巡猎舰解除光学伪装",
          name: "隐云母舰 · 蜃影",
        },
        gale: {
          radius: 64,
          hp: 2900,
          summonTimer: 4.6,
          intro: "风塔主机脱离固定基座",
          name: "风塔守卫 · 罡虎机",
        },
        volt: {
          radius: 66,
          hp: 3200,
          summonTimer: 4.4,
          intro: "边境裁决协议强制启动",
          name: "电网裁决舰 · 雷狱",
        },
      }[kind];
      this.boss = {
        kind,
        x: WIDTH / 2,
        y: -105,
        radius: stats.radius,
        hp: stats.hp,
        maxHp: stats.hp,
        age: 0,
        entered: false,
        fireTimer: 0.8,
        patternStep: 0,
        summonTimer: stats.summonTimer,
        flash: 0,
        phase: 1,
      };
      this.showBanner(stats.intro, stats.name, 3.4);
    }

    activateBurst() {
      if (this.state !== "playing" || this.player.energy < 100) return;
      this.player.energy = 0;
      this.player.invincible = Math.max(this.player.invincible, 2.2);
      this.player.burstTimer = 1.1;
      this.enemyBullets.forEach((bullet) => this.spawnSpark(bullet.x, bullet.y, "#82efff", 1));
      this.enemyBullets.length = 0;
      this.enemies.forEach((enemy) => this.damageEnemy(enemy, 95, false));
      if (this.boss) {
        this.boss.hp -= 150;
        this.boss.flash = 0.22;
      }
      this.score += 500;
      this.screenFlash = 0.5;
      this.shake = 14;
      this.audio.burst();
      ui.burstButton.classList.remove("ready");
    }

    loop(frameTime) {
      const dt = Math.min(0.033, Math.max(0, (frameTime - this.lastFrame) / 1000));
      this.lastFrame = frameTime;
      this.updateAmbient(dt);
      if (this.state === "playing") this.update(dt);
      this.render();
      requestAnimationFrame((time) => this.loop(time));
    }

    updateAmbient(dt) {
      this.ambientTime += dt;
      for (const star of this.stars) {
        star.y += star.speed * dt * (this.state === "playing" ? 1 : 0.35);
        if (star.y > HEIGHT + 4) {
          star.y = -4;
          star.x = random(0, WIDTH);
        }
      }
      for (const cloud of this.clouds) {
        cloud.y += cloud.speed * dt;
        if (cloud.y - cloud.radius > HEIGHT) {
          cloud.y = -cloud.radius * 2;
          cloud.x = random(-80, WIDTH);
        }
      }
    }

    update(dt) {
      this.time += dt;
      this.shake = Math.max(0, this.shake - dt * 22);
      this.screenFlash = Math.max(0, this.screenFlash - dt * 2.4);
      if (this.banner) {
        this.banner.timer -= dt;
        if (this.banner.timer <= 0) this.banner = null;
      }
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
      } else if (this.combo > 0) {
        this.combo = Math.max(0, this.combo - dt * 8);
      }

      while (this.waveIndex < this.waves.length && this.time >= this.waves[this.waveIndex].at) {
        this.waves[this.waveIndex].run();
        this.waveIndex += 1;
      }

      this.updateEndlessDirector();
      this.updateWeather(dt);
      this.updatePlayer(dt);
      this.updateEnemies(dt);
      this.updateBoss(dt);
      this.updateAirstrikes(dt);
      this.updateBullets(dt);
      this.updatePickups(dt);
      this.updateLightning(dt);
      this.updateParticles(dt);
      this.resolveCollisions();
      if (this.pickupNotice) {
        this.pickupNotice.timer -= dt;
        if (this.pickupNotice.timer <= 0) this.pickupNotice = null;
      }

      if (this.player.hull <= 0) this.finish(false);
    }

    updateWeather(dt) {
      this.weather.timer -= dt;
      this.weather.nextShift -= dt;
      this.weather.nextLightning -= dt;
      this.weather.nextLock -= dt;
      this.weather.nextCorridor -= dt;
      this.weather.nextGrid -= dt;

      if (
        this.weather.timer <= 0 &&
        this.weather.type !== "clear" &&
        this.weather.type !== "boss" &&
        this.weather.type !== "mirageBoss" &&
        this.weather.type !== "galeBoss" &&
        this.weather.type !== "voltBoss"
      ) {
        const calmWeather = {
          1: "高空晴朗",
          2: "云海静流",
          3: "回廊顺风",
          4: "电网待机",
        };
        this.setWeather(
          "clear",
          999,
          this.mode === "endless" ? "风暴间歇" : calmWeather[this.level],
        );
      }

      if (
        this.weather.type === "wind" ||
        this.weather.type === "storm" ||
        this.weather.type === "boss" ||
        this.weather.type === "jetstream" ||
        this.weather.type === "towerWind" ||
        this.weather.type === "reverseGale" ||
        this.weather.type === "galeBoss"
      ) {
        if (this.weather.nextShift <= 0) {
          const strength =
            this.weather.type === "jetstream"
              ? 72
              : this.weather.type === "galeBoss"
                ? 82
                : this.weather.type === "reverseGale"
                  ? 76
                  : this.weather.type === "boss"
                    ? 46
                    : 58;
          this.weather.targetWind = random(strength * 0.6, strength) * (Math.random() < 0.5 ? -1 : 1);
          const fastWind = ["jetstream", "towerWind", "reverseGale", "galeBoss"].includes(
            this.weather.type,
          );
          this.weather.nextShift = fastWind ? random(2.1, 3.4) : random(3.5, 6.5);
        }
      } else {
        this.weather.targetWind = 0;
      }
      this.weather.wind = lerp(this.weather.wind, this.weather.targetWind, 1 - Math.exp(-dt * 1.6));

      const hasLightning =
        this.weather.type === "thunder" ||
        this.weather.type === "storm" ||
        (this.weather.type === "boss" && this.boss?.phase >= 2);
      if (hasLightning && this.weather.nextLightning <= 0) {
        const targetPlayer = Math.random() < 0.65;
        const x = targetPlayer ? this.player.x + random(-65, 65) : random(50, WIDTH - 50);
        this.createLightningZone(clamp(x, 35, WIDTH - 35), random(42, 66));
        if (this.weather.type === "storm" && Math.random() < 0.35) {
          this.createLightningZone(random(45, WIDTH - 45), random(34, 50));
        }
        this.weather.nextLightning = this.weather.type === "boss" ? random(2.1, 3) : random(2.8, 4);
      }

      if (
        (this.weather.type === "hunt" || this.weather.type === "mirageBoss") &&
        this.weather.nextLock <= 0 &&
        !this.lockThreat
      ) {
        this.createLockThreat();
        this.weather.nextLock = this.weather.type === "mirageBoss" ? random(2.5, 3.4) : random(3.1, 4.2);
      }

      if (
        ["corridor", "reverseGale", "galeBoss"].includes(this.weather.type) &&
        this.weather.nextCorridor <= 0 &&
        !this.corridorGate
      ) {
        this.createCorridorGate(this.weather.type === "galeBoss" ? 128 : 150);
        this.weather.nextCorridor =
          this.weather.type === "galeBoss" ? random(2.7, 3.5) : random(3.6, 4.6);
      }

      if (
        ["grid", "crossGrid", "overload", "voltBoss"].includes(this.weather.type) &&
        this.weather.nextGrid <= 0
      ) {
        const axis =
          this.weather.type === "grid"
            ? "vertical"
            : this.weather.type === "crossGrid"
              ? Math.random() < 0.5
                ? "cross"
                : "horizontal"
              : Math.random() < 0.48
                ? "cross"
                : Math.random() < 0.5
                  ? "vertical"
                  : "horizontal";
        this.createGridHazard(axis);
        const interval =
          this.weather.type === "voltBoss"
            ? random(2.2, 3)
            : this.weather.type === "overload"
              ? random(2.5, 3.4)
              : random(3.2, 4.2);
        this.weather.nextGrid = interval;
      }

      this.updateLockThreat(dt);
      this.updateCorridorGate(dt);
      this.updateGridHazards(dt);
    }

    createCorridorGate(width = 150) {
      this.corridorGate = {
        centerX: random(width / 2 + 30, WIDTH - width / 2 - 30),
        width,
        timer: 0,
        lockAt: 0.72,
        strikeAt: 1.18,
        duration: 1.62,
        struck: false,
      };
    }

    updateCorridorGate(dt) {
      const gate = this.corridorGate;
      if (!gate) return;
      gate.timer += dt;
      if (!gate.struck && gate.timer >= gate.strikeAt) {
        gate.struck = true;
        const left = gate.centerX - gate.width / 2;
        const right = gate.centerX + gate.width / 2;
        if (this.player.x < left || this.player.x > right) this.hurtPlayer();
        this.enemies.forEach((enemy) => {
          if (enemy.x < left || enemy.x > right) this.damageEnemy(enemy, 52, true);
        });
        this.screenFlash = Math.max(this.screenFlash, 0.12);
        this.shake = Math.max(this.shake, 7);
        for (let i = 0; i < 24; i += 1) {
          const sideX = i % 2 ? left : right;
          this.spawnSpark(sideX, random(80, HEIGHT - 40), "#9ff6ff", 0.75);
        }
      }
      if (gate.timer >= gate.duration) this.corridorGate = null;
    }

    createGridHazard(axis = "vertical") {
      const strikeAt = 0.98;
      const common = { timer: 0, strikeAt, duration: 1.36, struck: false, width: 34 };
      if (axis === "vertical" || axis === "cross") {
        this.gridHazards.push({
          ...common,
          axis: "vertical",
          position: clamp(this.player.x + random(-105, 105), 42, WIDTH - 42),
        });
      }
      if (axis === "horizontal" || axis === "cross") {
        this.gridHazards.push({
          ...common,
          axis: "horizontal",
          position: clamp(this.player.y + random(-125, 65), 135, HEIGHT - 92),
        });
      }
    }

    updateGridHazards(dt) {
      for (const hazard of this.gridHazards) {
        hazard.timer += dt;
        if (!hazard.struck && hazard.timer >= hazard.strikeAt) {
          hazard.struck = true;
          const hitPlayer =
            hazard.axis === "vertical"
              ? Math.abs(this.player.x - hazard.position) < hazard.width / 2 + this.player.radius
              : Math.abs(this.player.y - hazard.position) < hazard.width / 2 + this.player.radius;
          if (hitPlayer) this.hurtPlayer();
          this.enemies.forEach((enemy) => {
            const hitEnemy =
              hazard.axis === "vertical"
                ? Math.abs(enemy.x - hazard.position) < hazard.width / 2 + enemy.radius
                : Math.abs(enemy.y - hazard.position) < hazard.width / 2 + enemy.radius;
            if (hitEnemy) this.damageEnemy(enemy, 58, true);
          });
          if (this.boss) {
            const hitBoss =
              hazard.axis === "vertical"
                ? Math.abs(this.boss.x - hazard.position) < hazard.width / 2 + this.boss.radius
                : Math.abs(this.boss.y - hazard.position) < hazard.width / 2 + this.boss.radius;
            if (hitBoss) {
              this.boss.hp -= 34;
              this.boss.flash = 0.16;
            }
          }
          this.audio.lightning();
          this.screenFlash = Math.max(this.screenFlash, 0.18);
          this.shake = Math.max(this.shake, 6);
        }
      }
      this.gridHazards = this.gridHazards.filter((hazard) => hazard.timer < hazard.duration);
    }

    createLockThreat() {
      this.lockThreat = {
        x: this.player.x,
        y: this.player.y,
        timer: 0,
        lockAt: 0.72,
        fireAt: 1.18,
        duration: 1.55,
        fired: false,
        radius: 28,
      };
    }

    updateLockThreat(dt) {
      const threat = this.lockThreat;
      if (!threat) return;
      threat.timer += dt;
      if (threat.timer < threat.lockAt) {
        threat.x = lerp(threat.x, this.player.x, 1 - Math.exp(-dt * 8));
        threat.y = lerp(threat.y, this.player.y, 1 - Math.exp(-dt * 8));
      }
      if (!threat.fired && threat.timer >= threat.fireAt) {
        threat.fired = true;
        this.screenFlash = Math.max(this.screenFlash, 0.15);
        this.shake = Math.max(this.shake, 6);
        if (distanceSquared(threat, this.player) < (threat.radius + this.player.radius) ** 2) {
          this.hurtPlayer();
        }
        this.fireRadial(threat.x, threat.y, 8, 92, "#6ff4ff", threat.timer);
        for (let i = 0; i < 18; i += 1) this.spawnSpark(threat.x, threat.y, "#bdfcff", 0.75);
      }
      if (threat.timer >= threat.duration) this.lockThreat = null;
    }

    createLightningZone(x, width = 52) {
      this.lightningZones.push({
        x,
        width,
        timer: 0,
        strikeAt: 0.92,
        duration: 1.28,
        struck: false,
      });
    }

    updatePlayer(dt) {
      const player = this.player;
      player.invincible = Math.max(0, player.invincible - dt);
      player.sinceHit += dt;
      player.burstTimer = Math.max(0, player.burstTimer - dt);
      player.overdriveTimer = Math.max(0, player.overdriveTimer - dt);
      if (player.sinceHit > 3.8 && player.shield < 100) {
        player.shield = Math.min(100, player.shield + dt * 8);
      }

      let dx = 0;
      let dy = 0;
      if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) dx -= 1;
      if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) dx += 1;
      if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) dy -= 1;
      if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) dy += 1;

      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        player.x += (dx / length) * player.speed * dt;
        player.y += (dy / length) * player.speed * dt;
        this.pointerTarget.x = player.x;
        this.pointerTarget.y = player.y;
      } else if (this.pointerActive) {
        const follow = 1 - Math.exp(-dt * 16);
        player.x = lerp(player.x, this.pointerTarget.x, follow);
        player.y = lerp(player.y, this.pointerTarget.y, follow);
      }

      const pointerTilt = this.pointerActive
        ? clamp((this.pointerTarget.x - player.x) / 180, -0.17, 0.17)
        : 0;
      const targetTilt = dx ? dx * 0.13 : pointerTilt;
      player.tilt = lerp(player.tilt, targetTilt, 1 - Math.exp(-dt * 9));
      player.x += this.weather.wind * dt * 0.34;
      player.x = clamp(player.x, 19, WIDTH - 19);
      player.y = clamp(player.y, 78, HEIGHT - 35);

      if (this.fighterId === "laser") {
        this.updateLaserWeapon(dt);
      } else if (this.fighterId === "dual") {
        this.updateDualLaserWeapon(dt);
      } else if (this.fighterId === "bomber") {
        this.updateBomberWeapon(dt);
      } else {
        player.laserActive = false;
        player.fireTimer -= dt;
        if (player.fireTimer <= 0) {
          this.firePlayerWeapon();
          player.fireTimer +=
            player.burstTimer > 0 ? 0.075 : player.overdriveTimer > 0 ? 0.085 : 0.13;
        }
      }

      if (Math.random() < dt * 15) {
        this.particles.push({
          x: player.x + random(-8, 8),
          y: player.y + 29,
          vx: random(-10, 10) - this.weather.wind * 0.15,
          vy: random(70, 125),
          life: random(0.18, 0.35),
          maxLife: 0.35,
          size: random(1.5, 3.5),
          color: player.burstTimer > 0 || player.overdriveTimer > 0 ? "#fff5a1" : "#45dfff",
        });
      }
    }

    firePlayerWeapon() {
      const boosted = this.player.burstTimer > 0 || this.player.overdriveTimer > 0;
      this.playerBullets.push(
        {
          x: this.player.x - 7,
          y: this.player.y - 29,
          vx: boosted ? -55 : -18,
          vy: -535,
          radius: 3,
          damage: boosted ? 17 : 14,
          life: 1.7,
        },
        {
          x: this.player.x + 7,
          y: this.player.y - 29,
          vx: boosted ? 55 : 18,
          vy: -535,
          radius: 3,
          damage: boosted ? 17 : 14,
          life: 1.7,
        },
      );
      this.audio.shot();
    }

    updateLaserWeapon(dt) {
      const player = this.player;
      player.laserSparkTimer = Math.max(0, player.laserSparkTimer - dt);
      player.laserAudioTimer = Math.max(0, player.laserAudioTimer - dt);

      if (player.laserCooling) {
        player.laserActive = false;
        player.laserHeat = Math.max(0, player.laserHeat - dt * 60);
        if (player.laserHeat <= 20) player.laserCooling = false;
        return;
      }

      player.laserActive = true;
      player.laserHeat = Math.min(100, player.laserHeat + dt * 24);
      if (player.laserHeat >= 100) {
        player.laserCooling = true;
        player.laserActive = false;
        this.audio.tone(240, 0.18, "sawtooth", 0.018, -70);
        return;
      }

      const target = this.findLaserTarget(player.x);

      player.laserEndY = target ? target.y + target.radius * 0.72 : 0;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const damage = (boosted ? 340 : 260) * dt;
      if (target) {
        this.damageLaserTarget(target, damage);
        if (player.laserSparkTimer <= 0) {
          this.spawnSpark(player.x + random(-3, 3), player.laserEndY, "#dffeff", 0.35);
          player.laserSparkTimer = boosted ? 0.035 : 0.055;
        }
      }
      if (player.laserAudioTimer <= 0) {
        this.audio.tone(boosted ? 980 : 760, 0.09, "sine", 0.006, 80);
        player.laserAudioTimer = 0.18;
      }
    }

    findLaserTarget(beamX) {
      let target = null;
      let nearestY = -Infinity;
      for (const enemy of this.enemies) {
        if (
          enemy.hp > 0 &&
          enemy.y < this.player.y &&
          enemy.y > nearestY &&
          Math.abs(enemy.x - beamX) <= enemy.radius + 5
        ) {
          target = enemy;
          nearestY = enemy.y;
        }
      }
      if (
        this.boss?.entered &&
        this.boss.y < this.player.y &&
        this.boss.y > nearestY &&
        Math.abs(this.boss.x - beamX) <= this.boss.radius + 5
      ) {
        target = this.boss;
      }
      return target;
    }

    damageLaserTarget(target, damage) {
      if (!target) return;
      if (target === this.boss) {
        target.hp -= damage;
        target.flash = 0.055;
      } else {
        this.damageEnemy(target, damage, false);
      }
    }

    updateDualLaserWeapon(dt) {
      const player = this.player;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const interval = boosted ? 0.12 : 0.18;
      player.dualLaserFireTimer -= dt;
      player.dualLaserCooldown = Math.max(0, player.dualLaserCooldown - dt);
      player.dualLaserActive = player.dualLaserCooldown > 0;
      if (player.dualLaserFireTimer > 0) return;

      const damage = boosted ? 22 : 18;
      const speed = boosted ? -860 : -760;
      for (const offset of [-11, 11]) {
        this.playerBullets.push({
          kind: "dualLaserBolt",
          x: player.x + offset,
          y: player.y - 39,
          vx: 0,
          vy: speed,
          radius: boosted ? 5.5 : 4.5,
          damage,
          life: 1.15,
          length: boosted ? 40 : 32,
        });
      }
      player.dualLaserActive = true;
      player.dualLaserCooldown = 0.055;
      player.dualLaserFireTimer += interval;
      this.audio.tone(boosted ? 790 : 650, 0.045, "square", 0.009, 130);
    }

    updateBomberWeapon(dt) {
      const player = this.player;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const interval = boosted ? 1 : 1.55;
      player.bombInterval = interval;
      player.bombTimer -= dt;
      if (player.bombTimer > 0) return;

      const target = this.findBombTarget();
      if (!target) {
        player.bombTimer = 0.18;
        return;
      }

      this.airstrikes.push({
        x: target.x,
        y: target.y,
        radius: boosted ? 66 : 58,
        damage: boosted ? 330 : 240,
        timer: 0,
        strikeAt: 0.3,
        duration: 0.72,
        struck: false,
      });
      player.bombTimer += interval;
      this.audio.tone(420, 0.07, "triangle", 0.014, 180);
    }

    findBombTarget() {
      const candidates = this.enemies.filter(
        (enemy) =>
          enemy.hp > 0 &&
          enemy.y > 20 &&
          enemy.y < this.player.y - 24 &&
          enemy.x > -30 &&
          enemy.x < WIDTH + 30,
      );
      if (this.boss?.entered && this.boss.hp > 0) candidates.push(this.boss);
      if (candidates.length === 0) return null;

      let bestTarget = candidates[0];
      let bestScore = -Infinity;
      const clusterRadiusSq = 58 * 58;
      for (const candidate of candidates) {
        let score = candidate === this.boss ? 4 : 0;
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0 || distanceSquared(candidate, enemy) > clusterRadiusSq) continue;
          score += enemy.type === "charger" ? 1.8 : enemy.type === "sweeper" ? 1.35 : 1;
        }
        score += candidate.y / HEIGHT * 0.18;
        if (score > bestScore) {
          bestScore = score;
          bestTarget = candidate;
        }
      }
      return { x: bestTarget.x, y: bestTarget.y };
    }

    updateAirstrikes(dt) {
      for (const strike of this.airstrikes) {
        strike.timer += dt;
        if (!strike.struck && strike.timer >= strike.strikeAt) {
          strike.struck = true;
          this.detonateAirstrike(strike);
        }
      }
      this.airstrikes = this.airstrikes.filter((strike) => strike.timer < strike.duration);
    }

    detonateAirstrike(strike) {
      this.shake = Math.max(this.shake, 5);
      this.screenFlash = Math.max(this.screenFlash, 0.09);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const reach = strike.radius + enemy.radius * 0.35;
        const distance = Math.sqrt(distanceSquared(strike, enemy));
        if (distance > reach) continue;
        const falloff = lerp(1, 0.62, clamp(distance / reach, 0, 1));
        this.damageEnemy(enemy, strike.damage * falloff, false);
      }
      if (this.boss?.entered && this.boss.hp > 0) {
        const reach = strike.radius + this.boss.radius * 0.3;
        const distance = Math.sqrt(distanceSquared(strike, this.boss));
        if (distance <= reach) {
          const falloff = lerp(1, 0.7, clamp(distance / reach, 0, 1));
          this.boss.hp -= strike.damage * falloff;
          this.boss.flash = 0.13;
        }
      }
      for (let i = 0; i < 26; i += 1) {
        const angle = random(0, TAU);
        const distance = random(4, strike.radius);
        this.spawnSpark(
          strike.x + Math.cos(angle) * distance,
          strike.y + Math.sin(angle) * distance,
          i % 3 === 0 ? "#ffe29a" : i % 2 ? "#d58aff" : "#ff8e63",
          random(0.7, 1.25),
        );
      }
      this.audio.explosion(1.05);
    }

    updatePickups(dt) {
      for (const pickup of this.pickups) {
        pickup.age += dt;
        const dx = this.player.x - pickup.x;
        const dy = this.player.y - pickup.y;
        const distance = Math.hypot(dx, dy);
        const magnetRange = pickup.magnetized ? 999 : 105;
        if (distance < magnetRange && distance > 1) {
          const pull = pickup.magnetized ? 610 : 330;
          pickup.vx = lerp(pickup.vx, (dx / distance) * pull, 1 - Math.exp(-dt * 7));
          pickup.vy = lerp(pickup.vy, (dy / distance) * pull, 1 - Math.exp(-dt * 7));
        } else {
          pickup.vy = lerp(pickup.vy, 58, 1 - Math.exp(-dt * 2.5));
        }
        pickup.x += pickup.vx * dt;
        pickup.y += pickup.vy * dt;
      }
      this.pickups = this.pickups.filter(
        (pickup) => !pickup.collected && pickup.y < HEIGHT + 45 && pickup.x > -45 && pickup.x < WIDTH + 45,
      );
    }

    updateEnemies(dt) {
      for (const enemy of this.enemies) {
        enemy.age += dt;
        enemy.fireTimer -= dt;
        enemy.flash = Math.max(0, enemy.flash - dt);

        if (enemy.type === "scout") {
          enemy.y += enemy.speed * dt;
          enemy.x += Math.sin(enemy.age * 2.2 + enemy.phase) * 42 * dt;
          if (enemy.fireTimer <= 0 && enemy.y > 40) {
            this.fireAimed(enemy.x, enemy.y + 8, 145, "#ffb25f");
            enemy.fireTimer = enemy.fireRate + random(-0.25, 0.25);
          }
        } else if (enemy.type === "sweeper") {
          enemy.y += enemy.speed * dt;
          enemy.x = enemy.originX + Math.sin(enemy.age * 1.4 + enemy.phase) * 66;
          if (enemy.fireTimer <= 0 && enemy.y > 35) {
            this.fireFan(enemy.x, enemy.y + 14, 3, 0.22, 132, "#ff6f78");
            enemy.fireTimer = enemy.fireRate;
          }
        } else if (enemy.type === "charger") {
          if (enemy.state === "enter") {
            enemy.y += enemy.speed * dt;
            if (enemy.y > 155 + Math.sin(enemy.phase) * 38) {
              enemy.state = "lock";
              enemy.stateTimer = 1.1;
              enemy.originX = this.player.x;
            }
          } else if (enemy.state === "lock") {
            enemy.stateTimer -= dt;
            enemy.x = lerp(enemy.x, enemy.originX, dt * 2.1);
            if (enemy.stateTimer <= 0) {
              enemy.state = "charge";
              enemy.stateTimer = 1.2;
              this.audio.enemyShot();
            }
          } else {
            enemy.y += 330 * dt;
            enemy.x += Math.sin(enemy.age * 8) * 20 * dt;
          }
          if (enemy.fireTimer <= 0 && enemy.state !== "charge") {
            this.fireFan(enemy.x, enemy.y + 12, 5, 0.16, 112, "#d28aff");
            enemy.fireTimer = enemy.fireRate;
          }
        }
      }

      this.enemies = this.enemies.filter((enemy) => {
        if (enemy.y > HEIGHT + 80 || enemy.x < -100 || enemy.x > WIDTH + 100) return false;
        return enemy.hp > 0;
      });
    }

    updateBoss(dt) {
      const boss = this.boss;
      if (!boss) return;
      boss.age += dt;
      boss.flash = Math.max(0, boss.flash - dt);

      if (!boss.entered) {
        boss.y = lerp(boss.y, 142, 1 - Math.exp(-dt * 1.7));
        if (Math.abs(boss.y - 142) < 2) {
          boss.entered = true;
          const objective = {
            yubo: "击破积雨云母舰的天候核心",
            mirage: "击破蜃影的三联追猎核心",
            gale: "击破罡虎机的双风轮核心",
            volt: "切断雷狱的裁决供电回路",
          };
          this.showBanner(
            "BOSS 战",
            objective[boss.kind],
            2.3,
          );
        }
        return;
      }

      if (boss.kind === "mirage") {
        this.updateMirageBoss(dt);
        return;
      }
      if (boss.kind === "gale") {
        this.updateGaleBoss(dt);
        return;
      }
      if (boss.kind === "volt") {
        this.updateVoltBoss(dt);
        return;
      }

      const hpRatio = boss.hp / boss.maxHp;
      const nextPhase = hpRatio > 0.66 ? 1 : hpRatio > 0.32 ? 2 : 3;
      if (nextPhase !== boss.phase) {
        boss.phase = nextPhase;
        boss.fireTimer = 0.35;
        this.screenFlash = 0.24;
        this.shake = 7;
        this.showBanner(`核心功率 ${nextPhase === 2 ? "67%" : "临界"}`, `母舰进入第 ${nextPhase} 作战形态`, 2.2);
      }

      const moveSpeed = boss.phase === 3 ? 1.35 : 0.82;
      const moveRange = boss.phase === 3 ? 142 : 112;
      boss.x = WIDTH / 2 + Math.sin(boss.age * moveSpeed) * moveRange;
      boss.y = 138 + Math.sin(boss.age * 1.8) * 12;
      boss.fireTimer -= dt;
      boss.summonTimer -= dt;

      if (boss.fireTimer <= 0) {
        if (boss.phase === 1) {
          this.fireFan(boss.x, boss.y + 34, 7, 0.14, 132, "#ff7c68");
          boss.fireTimer = 1.05;
        } else if (boss.phase === 2) {
          if (boss.patternStep % 2 === 0) {
            this.fireRadial(boss.x, boss.y, 14, 105, "#d583ff", boss.age * 0.35);
          } else {
            this.fireFan(boss.x, boss.y + 35, 9, 0.13, 152, "#ffbb61");
          }
          boss.patternStep += 1;
          boss.fireTimer = 0.82;
        } else {
          this.fireSpiral(boss.x, boss.y + 15, boss.patternStep, "#f0629c");
          if (boss.patternStep % 3 === 0) {
            this.fireAimed(boss.x - 42, boss.y + 22, 195, "#ffcf66");
            this.fireAimed(boss.x + 42, boss.y + 22, 195, "#ffcf66");
          }
          boss.patternStep += 1;
          boss.fireTimer = 0.28;
        }
      }

      if (boss.summonTimer <= 0) {
        if (boss.phase === 1) {
          this.spawnEnemy("scout", boss.x - 52, boss.y + 10, { phase: boss.age });
          this.spawnEnemy("scout", boss.x + 52, boss.y + 10, { phase: boss.age + 1 });
        } else if (boss.phase === 2) {
          this.spawnEnemy("sweeper", clamp(boss.x - 80, 50, WIDTH - 50), boss.y + 20, {
            phase: boss.age,
            hpScale: 0.8,
          });
        } else {
          this.createLightningZone(clamp(this.player.x + random(-45, 45), 40, WIDTH - 40), 54);
        }
        boss.summonTimer = boss.phase === 3 ? 3.6 : 5.8;
      }

      if (boss.hp <= 0) this.destroyBoss();
    }

    updateMirageBoss(dt) {
      const boss = this.boss;
      if (!boss) return;
      const hpRatio = boss.hp / boss.maxHp;
      const nextPhase = hpRatio > 0.68 ? 1 : hpRatio > 0.34 ? 2 : 3;
      if (nextPhase !== boss.phase) {
        boss.phase = nextPhase;
        boss.fireTimer = 0.28;
        boss.summonTimer = 2.4;
        this.screenFlash = 0.24;
        this.shake = 7;
        this.showBanner(
          nextPhase === 2 ? "双翼镜像展开" : "三联核心超载",
          `蜃影进入第 ${nextPhase} 追猎形态`,
          2.2,
        );
      }

      const moveRange = boss.phase === 3 ? 164 : 132;
      boss.x = WIDTH / 2 + Math.sin(boss.age * (boss.phase === 3 ? 1.18 : 0.72)) * moveRange;
      boss.y = 136 + Math.sin(boss.age * 1.45) * 18;
      boss.fireTimer -= dt;
      boss.summonTimer -= dt;

      if (boss.fireTimer <= 0) {
        if (boss.phase === 1) {
          this.fireFan(boss.x - 46, boss.y + 24, 4, 0.16, 142, "#67f0ff");
          this.fireFan(boss.x + 46, boss.y + 24, 4, 0.16, 142, "#a784ff");
          boss.fireTimer = 1.08;
        } else if (boss.phase === 2) {
          this.fireRadial(boss.x, boss.y, 16, 112, "#69e8e5", boss.patternStep * 0.19);
          if (boss.patternStep % 2 === 0) {
            this.fireAimed(boss.x - 58, boss.y + 22, 188, "#ffe18a");
            this.fireAimed(boss.x + 58, boss.y + 22, 188, "#ffe18a");
          }
          boss.patternStep += 1;
          boss.fireTimer = 0.78;
        } else {
          this.fireSpiral(boss.x - 48, boss.y + 14, boss.patternStep, "#5cf4ff");
          this.fireSpiral(boss.x + 48, boss.y + 14, boss.patternStep + 3, "#c784ff");
          if (boss.patternStep % 4 === 0 && !this.lockThreat) this.createLockThreat();
          boss.patternStep += 1;
          boss.fireTimer = 0.34;
        }
      }

      if (boss.summonTimer <= 0) {
        if (boss.phase === 1) {
          this.spawnEnemy("scout", clamp(boss.x - 66, 40, WIDTH - 40), boss.y + 14, { phase: boss.age });
          this.spawnEnemy("scout", clamp(boss.x + 66, 40, WIDTH - 40), boss.y + 14, { phase: boss.age + 1 });
        } else if (boss.phase === 2) {
          this.spawnEnemy("charger", clamp(this.player.x + random(-85, 85), 45, WIDTH - 45), -45, {
            phase: boss.age,
            hpScale: 0.85,
          });
        } else {
          this.spawnEnemy("sweeper", clamp(boss.x, 55, WIDTH - 55), boss.y + 18, {
            phase: boss.age,
            hpScale: 0.9,
          });
        }
        boss.summonTimer = boss.phase === 3 ? 4.2 : 5.3;
      }

      if (boss.hp <= 0) this.destroyBoss();
    }

    updateGaleBoss(dt) {
      const boss = this.boss;
      if (!boss) return;
      const hpRatio = boss.hp / boss.maxHp;
      const nextPhase = hpRatio > 0.68 ? 1 : hpRatio > 0.34 ? 2 : 3;
      if (nextPhase !== boss.phase) {
        boss.phase = nextPhase;
        boss.fireTimer = 0.25;
        boss.summonTimer = 2.2;
        this.screenFlash = 0.22;
        this.shake = 8;
        this.showBanner(
          nextPhase === 2 ? "双风轮逆向啮合" : "风塔核心超速",
          `罡虎机进入第 ${nextPhase} 风压形态`,
          2.2,
        );
      }

      const range = boss.phase === 3 ? 148 : 118;
      boss.x = WIDTH / 2 + Math.sin(boss.age * (boss.phase === 3 ? 1.5 : 0.92)) * range;
      boss.y = 140 + Math.sin(boss.age * 2) * 10;
      boss.fireTimer -= dt;
      boss.summonTimer -= dt;

      if (boss.fireTimer <= 0) {
        if (boss.phase === 1) {
          this.fireFan(boss.x - 48, boss.y + 22, 5, 0.14, 146, "#b9f8ff");
          this.fireFan(boss.x + 48, boss.y + 22, 5, 0.14, 146, "#ffd07a");
          boss.fireTimer = 1.08;
        } else if (boss.phase === 2) {
          this.fireRadial(boss.x, boss.y, 18, 116, "#7deaff", boss.patternStep * 0.17);
          if (boss.patternStep % 2 === 0) {
            this.fireFan(boss.x, boss.y + 32, 7, 0.11, 176, "#ffe48c");
          }
          boss.patternStep += 1;
          boss.fireTimer = 0.76;
        } else {
          this.fireSpiral(boss.x - 42, boss.y + 12, boss.patternStep, "#78efff");
          this.fireSpiral(boss.x + 42, boss.y + 12, -boss.patternStep, "#ffce68");
          if (boss.patternStep % 4 === 0 && !this.corridorGate) this.createCorridorGate(122);
          boss.patternStep += 1;
          boss.fireTimer = 0.31;
        }
      }

      if (boss.summonTimer <= 0) {
        if (boss.phase === 1) {
          this.spawnEnemy("scout", clamp(boss.x - 72, 40, WIDTH - 40), boss.y + 20, {
            phase: boss.age,
          });
          this.spawnEnemy("scout", clamp(boss.x + 72, 40, WIDTH - 40), boss.y + 20, {
            phase: boss.age + 1,
          });
        } else if (boss.phase === 2) {
          this.spawnEnemy("sweeper", clamp(boss.x, 55, WIDTH - 55), boss.y + 18, {
            phase: boss.age,
            hpScale: 0.9,
          });
        } else if (!this.corridorGate) {
          this.createCorridorGate(122);
        }
        boss.summonTimer = boss.phase === 3 ? 3.4 : 5.1;
      }

      if (boss.hp <= 0) this.destroyBoss();
    }

    updateVoltBoss(dt) {
      const boss = this.boss;
      if (!boss) return;
      const hpRatio = boss.hp / boss.maxHp;
      const nextPhase = hpRatio > 0.7 ? 1 : hpRatio > 0.35 ? 2 : 3;
      if (nextPhase !== boss.phase) {
        boss.phase = nextPhase;
        boss.fireTimer = 0.24;
        boss.summonTimer = 2.1;
        this.screenFlash = 0.28;
        this.shake = 8;
        this.showBanner(
          nextPhase === 2 ? "裁决回路并联" : "雷狱协议超载",
          `裁决舰进入第 ${nextPhase} 放电形态`,
          2.2,
        );
      }

      const range = boss.phase === 3 ? 156 : 126;
      boss.x = WIDTH / 2 + Math.sin(boss.age * (boss.phase === 3 ? 1.28 : 0.78)) * range;
      boss.y = 136 + Math.sin(boss.age * 1.65) * 16;
      boss.fireTimer -= dt;
      boss.summonTimer -= dt;

      if (boss.fireTimer <= 0) {
        if (boss.phase === 1) {
          this.fireRadial(boss.x, boss.y, 14, 122, "#f5e76c", boss.patternStep * 0.21);
          boss.patternStep += 1;
          boss.fireTimer = 0.96;
        } else if (boss.phase === 2) {
          this.fireFan(boss.x - 55, boss.y + 20, 5, 0.13, 168, "#6ff3ff");
          this.fireFan(boss.x + 55, boss.y + 20, 5, 0.13, 168, "#e6f56d");
          if (boss.patternStep % 2 === 0) this.createGridHazard("vertical");
          boss.patternStep += 1;
          boss.fireTimer = 0.78;
        } else {
          this.fireSpiral(boss.x, boss.y + 18, boss.patternStep, "#73f2ff");
          this.fireRadial(boss.x, boss.y, 10, 142, "#f2e85f", boss.patternStep * 0.12);
          if (boss.patternStep % 4 === 0) this.createGridHazard("cross");
          boss.patternStep += 1;
          boss.fireTimer = 0.38;
        }
      }

      if (boss.summonTimer <= 0) {
        if (boss.phase === 1) {
          this.spawnEnemy("charger", clamp(this.player.x + random(-95, 95), 45, WIDTH - 45), -45, {
            phase: boss.age,
            hpScale: 0.9,
          });
        } else if (boss.phase === 2) {
          this.spawnEnemy("sweeper", clamp(boss.x, 55, WIDTH - 55), boss.y + 18, {
            phase: boss.age,
            hpScale: 0.95,
          });
        } else {
          this.createGridHazard("cross");
        }
        boss.summonTimer = boss.phase === 3 ? 3.1 : 4.9;
      }

      if (boss.hp <= 0) this.destroyBoss();
    }

    fireAimed(x, y, speed, color) {
      const angle = Math.atan2(this.player.y - y, this.player.x - x);
      this.spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 5);
      this.audio.enemyShot();
    }

    fireFan(x, y, count, spread, speed, color) {
      const base = Math.atan2(this.player.y - y, this.player.x - x);
      for (let i = 0; i < count; i += 1) {
        const offset = (i - (count - 1) / 2) * spread;
        const angle = base + offset;
        this.spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 5);
      }
      this.audio.enemyShot();
    }

    fireRadial(x, y, count, speed, color, offset = 0) {
      for (let i = 0; i < count; i += 1) {
        const angle = offset + (i / count) * TAU;
        this.spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 4.5);
      }
      this.audio.enemyShot();
    }

    fireSpiral(x, y, step, color) {
      for (let arm = 0; arm < 3; arm += 1) {
        const angle = step * 0.34 + (arm / 3) * TAU;
        this.spawnEnemyBullet(x, y, Math.cos(angle) * 138, Math.sin(angle) * 138, color, 4.5);
      }
    }

    spawnEnemyBullet(x, y, vx, vy, color, radius) {
      if (this.enemyBullets.length >= 520) return;
      const speedScale =
        this.mode === "endless" ? this.getEndlessDifficulty().bulletScale : 1;
      this.enemyBullets.push({
        x,
        y,
        vx: vx * speedScale,
        vy: vy * speedScale,
        color,
        radius,
        age: 0,
        grazed: false,
      });
    }

    updateBullets(dt) {
      for (const bullet of this.playerBullets) {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
      }
      for (const bullet of this.enemyBullets) {
        const windEffect = this.weather.type === "storm" || this.weather.type === "boss" ? 0.13 : 0.06;
        bullet.x += (bullet.vx + this.weather.wind * windEffect) * dt;
        bullet.y += bullet.vy * dt;
        bullet.age += dt;
      }
      this.playerBullets = this.playerBullets.filter(
        (bullet) => bullet.life > 0 && bullet.y > -30 && bullet.x > -30 && bullet.x < WIDTH + 30,
      );
      this.enemyBullets = this.enemyBullets.filter(
        (bullet) =>
          bullet.y > -80 &&
          bullet.y < HEIGHT + 80 &&
          bullet.x > -80 &&
          bullet.x < WIDTH + 80,
      );
    }

    updateLightning(dt) {
      for (const zone of this.lightningZones) {
        zone.timer += dt;
        if (!zone.struck && zone.timer >= zone.strikeAt) {
          zone.struck = true;
          this.audio.lightning();
          this.shake = 7;
          this.screenFlash = 0.2;
          const halfWidth = zone.width / 2;
          if (
            Math.abs(this.player.x - zone.x) < halfWidth + this.player.radius &&
            this.player.invincible <= 0
          ) {
            this.hurtPlayer();
          }
          for (const enemy of this.enemies) {
            if (Math.abs(enemy.x - zone.x) < halfWidth + enemy.radius) {
              this.damageEnemy(enemy, 55, true);
            }
          }
          if (this.boss && Math.abs(this.boss.x - zone.x) < halfWidth + this.boss.radius) {
            this.boss.hp -= 35;
            this.boss.flash = 0.15;
          }
          for (let i = 0; i < 22; i += 1) {
            this.spawnSpark(zone.x + random(-halfWidth, halfWidth), random(50, HEIGHT - 30), "#e9fdff", 1.2);
          }
        }
      }
      this.lightningZones = this.lightningZones.filter((zone) => zone.timer < zone.duration);
    }

    updateParticles(dt) {
      for (const particle of this.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.pow(0.96, dt * 60);
        particle.vy *= Math.pow(0.98, dt * 60);
        particle.life -= dt;
      }
      this.particles = this.particles.filter((particle) => particle.life > 0);
    }

    resolveCollisions() {
      for (const bullet of this.playerBullets) {
        if (bullet.life <= 0) continue;
        let target = null;
        for (const enemy of this.enemies) {
          const combined = bullet.radius + enemy.radius;
          if (distanceSquared(bullet, enemy) < combined * combined) {
            target = enemy;
            break;
          }
        }
        if (target) {
          bullet.life = 0;
          this.damageEnemy(target, bullet.damage, false);
          continue;
        }
        if (this.boss?.entered) {
          const combined = bullet.radius + this.boss.radius;
          if (distanceSquared(bullet, this.boss) < combined * combined) {
            bullet.life = 0;
            this.boss.hp -= bullet.damage;
            this.boss.flash = 0.055;
            if (Math.random() < 0.3) this.spawnSpark(bullet.x, bullet.y, "#91efff", 0.45);
          }
        }
      }

      for (const bullet of this.enemyBullets) {
        const combined = bullet.radius + this.player.radius;
        const distSq = distanceSquared(bullet, this.player);
        if (distSq < combined * combined) {
          bullet.y = HEIGHT + 100;
          this.hurtPlayer();
        } else if (!bullet.grazed && distSq < (combined + 18) * (combined + 18)) {
          bullet.grazed = true;
          this.grazeCount += 1;
          this.player.energy = Math.min(100, this.player.energy + 2.8);
          this.score += 24;
          this.combo = Math.min(99, this.combo + 1);
          this.maxCombo = Math.max(this.maxCombo, Math.floor(this.combo));
          this.comboTimer = 2.8;
          this.spawnSpark(bullet.x, bullet.y, "#8ef7ff", 0.55);
          if (this.grazeCount % 4 === 1) this.audio.graze();
        }
      }

      for (const enemy of this.enemies) {
        const combined = enemy.radius + this.player.radius;
        if (distanceSquared(enemy, this.player) < combined * combined) {
          enemy.hp = 0;
          this.explodeEnemy(enemy, false);
          this.hurtPlayer();
        }
      }

      for (const pickup of this.pickups) {
        const combined = pickup.radius + this.player.radius;
        if (!pickup.collected && distanceSquared(pickup, this.player) < combined * combined) {
          this.collectPickup(pickup);
        }
      }
    }

    damageEnemy(enemy, amount, environmental) {
      if (enemy.hp <= 0) return;
      enemy.hp -= amount;
      enemy.flash = 0.08;
      if (enemy.hp <= 0) {
        this.explodeEnemy(enemy, environmental);
      } else if (Math.random() < 0.25) {
        this.spawnSpark(enemy.x + random(-8, 8), enemy.y + random(-8, 8), "#9cefff", 0.45);
      }
    }

    explodeEnemy(enemy, environmental) {
      if (enemy.exploded) return;
      enemy.exploded = true;
      const multiplier = 1 + Math.floor(this.combo / 12) * 0.2;
      this.score += Math.round(enemy.score * multiplier);
      this.combo = Math.min(99, this.combo + (enemy.type === "charger" ? 3 : 2));
      this.maxCombo = Math.max(this.maxCombo, Math.floor(this.combo));
      this.comboTimer = 3;
      this.player.energy = Math.min(100, this.player.energy + (environmental ? 10 : 5));
      for (let i = 0; i < 13; i += 1) {
        this.spawnSpark(
          enemy.x,
          enemy.y,
          Math.random() < 0.45 ? "#ffbb68" : "#6eeeff",
          random(0.65, 1.15),
        );
      }
      if (environmental && (this.level === 4 || this.mode === "endless")) {
        this.chainFromEnemy(enemy);
      }
      this.maybeDropPickup(enemy);
      this.audio.explosion(enemy.type === "charger" ? 1.2 : 0.8);
    }

    chainFromEnemy(origin) {
      const targets = this.enemies
        .filter(
          (enemy) =>
            enemy !== origin &&
            enemy.hp > 0 &&
            distanceSquared(origin, enemy) < 135 * 135,
        )
        .sort((a, b) => distanceSquared(origin, a) - distanceSquared(origin, b))
        .slice(0, 2);
      for (const target of targets) {
        for (let i = 1; i <= 7; i += 1) {
          const amount = i / 8;
          this.spawnSpark(
            lerp(origin.x, target.x, amount) + random(-3, 3),
            lerp(origin.y, target.y, amount) + random(-3, 3),
            i % 2 ? "#eaf66d" : "#72f2ff",
            0.38,
          );
        }
        this.damageEnemy(target, 34, false);
      }
    }

    maybeDropPickup(enemy) {
      const chance = {
        scout: 0.08,
        sweeper: 0.18,
        charger: 0.38,
      }[enemy.type] || 0;
      if (Math.random() >= chance) return;
      const roll = Math.random();
      const type = roll < 0.38 ? "energy" : roll < 0.63 ? "repair" : roll < 0.83 ? "overdrive" : "score";
      this.spawnPickup(type, enemy.x, enemy.y);
    }

    spawnPickup(type, x, y, options = {}) {
      this.pickups.push({
        type,
        x,
        y,
        vx: options.vx ?? random(-24, 24),
        vy: options.vy ?? random(18, 45),
        radius: 11,
        age: 0,
        collected: false,
        magnetized: options.magnetized === true,
      });
    }

    collectPickup(pickup) {
      pickup.collected = true;
      let label = "";
      let color = "#7cecff";
      if (pickup.type === "repair") {
        color = "#69f0b0";
        if (this.player.shield >= 100) {
          this.score += 400;
          label = "护盾已满 · +400";
        } else {
          this.player.shield = Math.min(100, this.player.shield + 30);
          label = "护盾修复 +30";
        }
      } else if (pickup.type === "energy") {
        if (this.player.energy >= 100) {
          this.score += 400;
          label = "能量已满 · +400";
        } else {
          this.player.energy = Math.min(100, this.player.energy + 30);
          label = "气象能量 +30";
        }
      } else if (pickup.type === "overdrive") {
        color = "#ff9e5f";
        this.player.overdriveTimer = Math.min(16, this.player.overdriveTimer + 8);
        label = "火力过载 8秒";
      } else {
        color = "#ffe06e";
        this.score += 700;
        label = "积分核心 +700";
      }
      this.pickupNotice = { label, color, timer: 1.45, maxTimer: 1.45 };
      for (let i = 0; i < 12; i += 1) this.spawnSpark(pickup.x, pickup.y, color, 0.6);
      this.audio.tone(pickup.type === "score" ? 920 : 710, 0.12, "triangle", 0.026, 150);
    }

    hurtPlayer() {
      if (this.player.invincible > 0 || this.state !== "playing") return;
      this.player.sinceHit = 0;
      this.player.invincible = 1.35;
      this.combo = 0;
      this.comboTimer = 0;
      if (this.player.shield > 0) {
        this.player.shield = Math.max(0, this.player.shield - 28);
      } else {
        this.player.hull -= 1;
        if (this.player.hull > 0) this.player.shield = 55;
      }
      this.shake = 13;
      this.screenFlash = 0.36;
      this.audio.hit();
      for (let i = 0; i < 20; i += 1) {
        this.spawnSpark(this.player.x, this.player.y, "#ff8d73", random(0.6, 1.25));
      }
    }

    spawnSpark(x, y, color, strength = 1) {
      const angle = random(0, TAU);
      const speed = random(35, 165) * strength;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(0.2, 0.58) * strength,
        maxLife: 0.58 * strength,
        size: random(1.2, 3.6) * strength,
        color,
      });
    }

    destroyBoss() {
      if (!this.boss) return;
      const x = this.boss.x;
      const y = this.boss.y;
      for (let i = 0; i < 95; i += 1) {
        this.spawnSpark(x + random(-55, 55), y + random(-40, 40), i % 3 ? "#ffae57" : "#a9f7ff", random(0.7, 1.8));
      }
      this.score += 6000 + Math.floor(this.player.hull * 1000 + this.player.shield * 10);
      this.enemyBullets.length = 0;
      const rewards =
        this.mode === "endless"
          ? ["energy", this.player.shield < 70 ? "repair" : "overdrive", "score"]
          : ["repair", "energy", "overdrive", "score"];
      rewards.forEach((type, index) => {
        const offset = index - (rewards.length - 1) / 2;
        this.spawnPickup(type, x + offset * 30, y + 8, {
          vx: offset * 35,
          vy: 30,
          magnetized: true,
        });
      });
      this.boss = null;
      this.shake = 22;
      this.screenFlash = 1;
      this.audio.explosion(2.4);
      if (this.mode === "endless") {
        this.endless.bossesDefeated += 1;
        this.endless.restUntil = this.time + 6;
        this.endless.nextWave = this.endless.restUntil;
        this.endless.nextWeather = this.endless.restUntil + 5;
        this.endless.nextBoss =
          this.time + Math.max(55, 75 - this.endless.bossesDefeated * 2);
        this.player.invincible = Math.max(this.player.invincible, 2.5);
        this.setWeather("clear", 999, "短暂休整");
        this.showBanner(
          `第 ${this.endless.bossesDefeated} 台 BOSS 已击破`,
          `下一台预计 ${Math.ceil(this.endless.nextBoss - this.time)} 秒后抵达`,
          3.4,
        );
        return;
      }
      setTimeout(() => {
        if (this.state === "playing") this.finish(true);
      }, 2200);
    }

    finish(victory) {
      if (this.state !== "playing") return;
      if (this.mode === "endless") {
        this.state = "gameover";
        this.save.bestEndlessScore = Math.max(
          this.save.bestEndlessScore,
          Math.floor(this.score),
        );
        this.save.bestEndlessTime = Math.max(
          this.save.bestEndlessTime,
          Math.floor(this.time),
        );
        saveData(this.save);
        this.updatePersistentUI();
        ui.resultKicker.textContent = "无尽风暴结束";
        ui.resultTitle.textContent = `坚持 ${formatTime(this.time)}`;
        ui.finalScoreLabel.textContent = "最终得分";
        ui.finalComboLabel.textContent = "生存时间";
        ui.finalGrazeLabel.textContent = "击破 BOSS";
        ui.finalScore.textContent = formatScore(this.score);
        ui.finalCombo.textContent = formatTime(this.time);
        ui.finalGraze.textContent = String(this.endless.bossesDefeated);
        ui.resultMessage.textContent =
          `抵达风暴压力 ${this.endless.pressure}，最高连击 ${this.maxCombo}，擦弹 ${this.grazeCount} 次。` +
          "敌机密度、耐久、速度、弹速与复合天气会继续随时间提升。";
        ui.replayButton.textContent = "再次进入无尽风暴";
        setTimeout(() => ui.resultPanel.classList.add("visible"), 350);
        return;
      }
      this.state = victory ? "victory" : "gameover";
      if (victory) this.save.unlockedLevel = Math.max(this.save.unlockedLevel, Math.min(4, this.level + 1));
      if (this.score > this.save.bestScore) {
        this.save.bestScore = Math.floor(this.score);
      }
      saveData(this.save);
      this.updatePersistentUI();
      ui.resultKicker.textContent = victory ? "任务完成" : "任务中断";
      ui.resultTitle.textContent = victory ? LEVELS[this.level].clearTitle : "战机失去响应";
      ui.finalScoreLabel.textContent = "最终得分";
      ui.finalComboLabel.textContent = "最高连击";
      ui.finalGrazeLabel.textContent = "擦弹次数";
      ui.finalScore.textContent = formatScore(this.score);
      ui.finalCombo.textContent = String(this.maxCombo);
      ui.finalGraze.textContent = String(this.grazeCount);
      const victoryMessages = {
        1: "晴空防线恢复稳定。第二航路“云海追猎”已经开放。",
        2: "蜃影信号消失。第三航路“风塔回廊”已经开放。",
        3: "风塔叶阵恢复同步。第四航路“电网边境”已经开放。",
        4: "裁决回路已经切断，边境电网重归友军控制。第一章前四关完成。",
      };
      const failureMessages = {
        1: "调整飞行路线，利用雷击摧毁敌机后再次出击。",
        2: "观察锁定准星的闭合时机，利用云隙重新发起追猎。",
        3: "先识别青色安全航道，再跟随横风完成位置修正。",
        4: "预判横纵预警线，并把敌机引入即将放电的网格。",
      };
      ui.resultMessage.textContent = victory
        ? victoryMessages[this.level]
        : failureMessages[this.level];
      ui.replayButton.textContent = victory
        ? this.level < 4
          ? `进入第${["", "一", "二", "三", "四"][this.level + 1]}关`
          : "再次挑战第四关"
        : "重新挑战本关";
      setTimeout(() => ui.resultPanel.classList.add("visible"), victory ? 900 : 350);
      if (victory) this.audio.victory();
    }

    render() {
      ctx.save();
      const shakeX = this.shake > 0 ? random(-this.shake, this.shake) : 0;
      const shakeY = this.shake > 0 ? random(-this.shake, this.shake) : 0;
      ctx.translate(shakeX, shakeY);
      this.drawBackground();

      if (this.state !== "menu") {
        this.drawLightningZones();
        this.drawCorridorGate();
        this.drawGridHazards();
        this.drawAirstrikes();
        this.drawParticles();
        this.drawPlayerLaser();
        this.drawEnemies();
        this.drawBoss();
        this.drawBullets();
        this.drawPickups();
        this.drawLockThreat();
        this.drawPlayer();
        this.drawWeatherOverlay();
        this.drawHud();
        this.drawPickupNotice();
        this.drawBanner();
      }

      if (this.screenFlash > 0) {
        ctx.fillStyle = `rgba(210, 249, 255, ${this.screenFlash * 0.42})`;
        ctx.fillRect(-30, -30, WIDTH + 60, HEIGHT + 60);
      }
      ctx.restore();
    }

    drawBackground() {
      const palettes = {
        skyCity: ["#071b31", "#0c4261", "#0a2338", "#bbedff"],
        cloudSea: ["#071a28", "#315d70", "#132d3e", "#e4fbff"],
        windCorridor: ["#0b1a25", "#244957", "#102630", "#c9fbff"],
        powerGrid: ["#05071a", "#171640", "#080b22", "#d9f8ff"],
        thunderCanyon: ["#100c22", "#29204a", "#111125", "#d5c8ff"],
        sandstorm: ["#291912", "#75442a", "#342015", "#ffd6a2"],
        polarNight: ["#071525", "#103c4a", "#10192f", "#c9fff4"],
        orbitalRuins: ["#030711", "#10182d", "#070a17", "#d9e5ff"],
      };
      const palette = palettes[this.environment];
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      const storming =
        this.weather?.type === "storm" || this.weather?.type === "boss" || this.weather?.type === "thunder";
      if (storming) {
        gradient.addColorStop(0, "#080b18");
        gradient.addColorStop(0.45, this.environment === "sandstorm" ? "#3b2724" : "#18233a");
        gradient.addColorStop(1, "#070b14");
      } else {
        gradient.addColorStop(0, palette[0]);
        gradient.addColorStop(0.45, palette[1]);
        gradient.addColorStop(1, palette[2]);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      for (const star of this.stars) {
        ctx.fillStyle = palette[3];
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size * 2.3);
      }
      ctx.globalAlpha = 1;

      if (["skyCity", "cloudSea", "thunderCanyon", "polarNight"].includes(this.environment)) {
        ctx.save();
        for (const cloud of this.clouds) {
          const cloudGradient = ctx.createRadialGradient(
            cloud.x,
            cloud.y,
            0,
            cloud.x,
            cloud.y,
            cloud.radius,
          );
          const tint =
            this.environment === "thunderCanyon"
              ? "151, 126, 194"
              : this.environment === "cloudSea"
                ? "218, 245, 248"
                : "177, 225, 235";
          cloudGradient.addColorStop(0, `rgba(${tint}, ${cloud.alpha})`);
          cloudGradient.addColorStop(1, "rgba(75, 129, 154, 0)");
          ctx.fillStyle = cloudGradient;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.radius, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      const scroll = (this.ambientTime * 30) % 160;
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = this.environment === "sandstorm" ? "#dc9364" : "#58c8e8";
      ctx.lineWidth = 1;
      for (let y = -160 + scroll; y < HEIGHT + 160; y += 160) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y + 100);
        ctx.stroke();
      }
      ctx.restore();

      if (this.environment === "skyCity") this.drawDistantCity();
      else if (this.environment === "cloudSea") this.drawCloudSea();
      else if (this.environment === "windCorridor") this.drawWindCorridor();
      else if (this.environment === "powerGrid") this.drawPowerGrid();
      else if (this.environment === "thunderCanyon") this.drawThunderCanyon();
      else if (this.environment === "sandstorm") this.drawSandstormRuins();
      else if (this.environment === "polarNight") this.drawPolarAurora();
      else this.drawOrbitalRuins();
      const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 170, WIDTH / 2, HEIGHT / 2, 490);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,3,9,0.64)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    drawDistantCity() {
      const y = HEIGHT - ((this.ambientTime * 22) % 270);
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#6ee2ff";
      ctx.fillStyle = "#0f6680";
      for (let row = -1; row <= 2; row += 1) {
        const baseY = y + row * 270;
        for (let i = 0; i < 8; i += 1) {
          const x = i * 68 - 22;
          const h = 22 + ((i * 17 + row * 13) % 38);
          ctx.fillRect(x, baseY - h, 38, h);
          ctx.strokeRect(x, baseY - h, 38, h);
        }
      }
      ctx.restore();
    }

    drawCloudSea() {
      const scroll = (this.ambientTime * 18) % 240;
      ctx.save();
      for (let row = -1; row < 5; row += 1) {
        const y = row * 240 + scroll;
        const layer = row % 2 === 0;
        const gradient = ctx.createLinearGradient(0, y - 85, 0, y + 80);
        gradient.addColorStop(0, "rgba(218, 249, 252, 0)");
        gradient.addColorStop(0.48, layer ? "rgba(205, 241, 246, 0.16)" : "rgba(142, 203, 217, 0.12)");
        gradient.addColorStop(1, "rgba(132, 195, 211, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-50, y + 30);
        for (let x = -50; x <= WIDTH + 50; x += 55) {
          const crest = Math.sin(x * 0.028 + row * 1.7) * 23;
          ctx.quadraticCurveTo(x + 27, y - 42 + crest, x + 55, y + 20);
        }
        ctx.lineTo(WIDTH + 60, y + 100);
        ctx.lineTo(-60, y + 100);
        ctx.closePath();
        ctx.fill();
      }

      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = "#a7edf4";
      ctx.fillStyle = "#204b5c";
      for (let row = -1; row < 4; row += 1) {
        const y = row * 280 + ((this.ambientTime * 26) % 280);
        for (let i = 0; i < 4; i += 1) {
          const x = 52 + i * 118 + ((row + i) % 2) * 28;
          ctx.beginPath();
          ctx.moveTo(x, y - 20);
          ctx.lineTo(x + 15, y);
          ctx.lineTo(x, y + 20);
          ctx.lineTo(x - 15, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y - 20);
          ctx.lineTo(x, y - 42);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawWindCorridor() {
      const scroll = (this.ambientTime * 42) % 220;
      ctx.save();
      const laneGradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
      laneGradient.addColorStop(0, "rgba(9, 20, 27, 0.9)");
      laneGradient.addColorStop(0.22, "rgba(71, 137, 145, 0.1)");
      laneGradient.addColorStop(0.5, "rgba(102, 219, 221, 0.14)");
      laneGradient.addColorStop(0.78, "rgba(71, 137, 145, 0.1)");
      laneGradient.addColorStop(1, "rgba(9, 20, 27, 0.9)");
      ctx.fillStyle = laneGradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      for (let row = -1; row < 5; row += 1) {
        const y = row * 220 + scroll;
        for (const side of [-1, 1]) {
          const x = side < 0 ? 42 : WIDTH - 42;
          ctx.strokeStyle = "rgba(118, 236, 239, 0.34)";
          ctx.fillStyle = "rgba(21, 55, 62, 0.72)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - side * 28, y - 78);
          ctx.lineTo(x + side * 14, y - 56);
          ctx.lineTo(x + side * 26, y + 62);
          ctx.lineTo(x - side * 18, y + 84);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.translate(x, y);
          ctx.rotate(this.ambientTime * side * 0.8 + row);
          ctx.strokeStyle = "rgba(255, 194, 103, 0.5)";
          ctx.beginPath();
          ctx.arc(0, 0, 25, 0, TAU);
          ctx.stroke();
          for (let blade = 0; blade < 4; blade += 1) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(23, -5);
            ctx.lineTo(18, 6);
            ctx.closePath();
            ctx.stroke();
          }
          ctx.rotate(-this.ambientTime * side * 0.8 - row);
          ctx.translate(-x, -y);
        }
      }

      ctx.strokeStyle = "rgba(151, 245, 247, 0.2)";
      ctx.setLineDash([8, 12]);
      for (const x of [130, WIDTH - 130]) {
        ctx.beginPath();
        ctx.moveTo(WIDTH / 2, -30);
        ctx.lineTo(x, HEIGHT + 20);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    drawPowerGrid() {
      const scroll = (this.ambientTime * 34) % 96;
      ctx.save();
      ctx.strokeStyle = "rgba(90, 225, 255, 0.17)";
      ctx.lineWidth = 1;
      for (let y = -96 + scroll; y < HEIGHT + 96; y += 96) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y + 32);
        ctx.stroke();
      }
      for (let x = -40; x < WIDTH + 60; x += 70) {
        ctx.beginPath();
        ctx.moveTo(WIDTH / 2, -20);
        ctx.lineTo(x, HEIGHT + 20);
        ctx.stroke();
      }

      for (let row = -1; row < 6; row += 1) {
        const y = row * 170 + ((this.ambientTime * 38) % 170);
        for (const x of [34, WIDTH - 34]) {
          const pulse = 0.35 + Math.sin(this.ambientTime * 4 + row) * 0.12;
          ctx.fillStyle = "rgba(17, 20, 59, 0.86)";
          ctx.strokeStyle = `rgba(223, 241, 83, ${pulse})`;
          ctx.beginPath();
          ctx.moveTo(x, y - 36);
          ctx.lineTo(x + 18, y - 8);
          ctx.lineTo(x + 12, y + 32);
          ctx.lineTo(x - 12, y + 32);
          ctx.lineTo(x - 18, y - 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = `rgba(102, 241, 255, ${pulse})`;
          ctx.fillRect(x - 3, y - 17, 6, 31);
        }
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(205, 241, 77, 0.2)";
      for (let i = 0; i < 8; i += 1) {
        const y = (i * 113 + this.ambientTime * 48) % HEIGHT;
        ctx.beginPath();
        ctx.moveTo(38, y);
        ctx.lineTo(110, y + Math.sin(this.ambientTime * 3 + i * 1.7) * 8);
        ctx.lineTo(164, y + Math.cos(this.ambientTime * 2.4 + i * 1.3) * 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawThunderCanyon() {
      const scroll = (this.ambientTime * 25) % 260;
      ctx.save();
      ctx.fillStyle = "rgba(27, 16, 48, 0.72)";
      ctx.strokeStyle = "rgba(190, 116, 255, 0.3)";
      ctx.lineWidth = 1.3;
      for (let row = -1; row < 4; row += 1) {
        const y = row * 260 + scroll;
        ctx.beginPath();
        ctx.moveTo(0, y - 90);
        ctx.lineTo(78, y - 45);
        ctx.lineTo(35, y + 25);
        ctx.lineTo(94, y + 92);
        ctx.lineTo(0, y + 145);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(WIDTH, y - 70);
        ctx.lineTo(WIDTH - 68, y - 20);
        ctx.lineTo(WIDTH - 24, y + 42);
        ctx.lineTo(WIDTH - 87, y + 105);
        ctx.lineTo(WIDTH, y + 155);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSandstormRuins() {
      const scroll = (this.ambientTime * 20) % 230;
      ctx.save();
      const haze = ctx.createLinearGradient(0, 0, WIDTH, 0);
      haze.addColorStop(0, "rgba(255, 154, 80, 0)");
      haze.addColorStop(0.45, "rgba(255, 177, 100, 0.13)");
      haze.addColorStop(1, "rgba(255, 154, 80, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "rgba(58, 30, 22, 0.5)";
      ctx.strokeStyle = "rgba(239, 153, 91, 0.28)";
      for (let row = -1; row < 5; row += 1) {
        const y = row * 230 + scroll;
        for (let i = 0; i < 5; i += 1) {
          const x = 18 + i * 102 + ((row + i) % 2) * 16;
          const height = 20 + ((i * 13 + row * 7) % 42);
          ctx.fillRect(x, y - height, 42, height);
          ctx.strokeRect(x, y - height, 42, height);
          ctx.fillRect(x + 10, y - height - 11, 4, 11);
        }
      }
      ctx.strokeStyle = "rgba(255, 200, 133, 0.2)";
      for (let i = 0; i < 24; i += 1) {
        const y = (i * 37 + this.ambientTime * 90) % HEIGHT;
        const x = (i * 79 + this.ambientTime * 55) % (WIDTH + 100) - 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 35, y + 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPolarAurora() {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let band = 0; band < 3; band += 1) {
        const y = 85 + band * 100;
        const wave = Math.sin(this.ambientTime * 0.7 + band) * 28;
        const aurora = ctx.createLinearGradient(0, y, WIDTH, y + 110);
        aurora.addColorStop(0, "rgba(76, 255, 203, 0)");
        aurora.addColorStop(0.45, band === 1 ? "rgba(119, 126, 255, 0.18)" : "rgba(76, 255, 203, 0.17)");
        aurora.addColorStop(1, "rgba(76, 255, 203, 0)");
        ctx.fillStyle = aurora;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.bezierCurveTo(110, y - 45, 310, y + 85, WIDTH, y + wave * 0.3);
        ctx.lineTo(WIDTH, y + 115);
        ctx.bezierCurveTo(300, y + 35, 130, y + 125, 0, y + 75);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawOrbitalRuins() {
      ctx.save();
      ctx.globalAlpha = 0.32;
      const planet = ctx.createRadialGradient(365, 110, 25, 365, 110, 190);
      planet.addColorStop(0, "rgba(91, 146, 214, 0.34)");
      planet.addColorStop(0.7, "rgba(32, 60, 110, 0.25)");
      planet.addColorStop(1, "rgba(15, 24, 45, 0)");
      ctx.fillStyle = planet;
      ctx.beginPath();
      ctx.arc(365, 110, 190, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(154, 197, 255, 0.38)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(365, 110, 176, 1.8, 4.7);
      ctx.stroke();
      const scroll = (this.ambientTime * 28) % 260;
      ctx.fillStyle = "rgba(101, 127, 170, 0.38)";
      ctx.strokeStyle = "rgba(166, 213, 255, 0.34)";
      for (let row = -1; row < 4; row += 1) {
        const y = row * 260 + scroll;
        for (let i = 0; i < 5; i += 1) {
          const x = 22 + i * 96 + ((row + i) % 2) * 18;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((i - 2) * 0.18);
          ctx.fillRect(-12, -6, 24 + (i % 2) * 15, 12);
          ctx.strokeRect(-12, -6, 24 + (i % 2) * 15, 12);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    drawWeatherOverlay() {
      if (Math.abs(this.weather.wind) > 8) {
        ctx.save();
        ctx.strokeStyle = `rgba(141, 232, 255, ${0.08 + Math.abs(this.weather.wind) / 520})`;
        ctx.lineWidth = 1.4;
        const direction = Math.sign(this.weather.wind);
        for (let i = 0; i < 18; i += 1) {
          const y = (i * 53 + this.ambientTime * 115) % HEIGHT;
          const x = (i * 83 + this.ambientTime * Math.abs(this.weather.wind) * 2) % (WIDTH + 160) - 80;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + direction * 42, y + 10);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (this.weather.type === "eye") {
        ctx.fillStyle = "rgba(161, 245, 255, 0.035)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      if (this.weather.type === "mist" || this.weather.type === "mirageBoss") {
        ctx.save();
        for (let i = 0; i < 7; i += 1) {
          const x = ((i * 91 + this.ambientTime * (12 + i * 2)) % (WIDTH + 180)) - 90;
          const y = (i * 137 + this.ambientTime * 22) % (HEIGHT + 180) - 90;
          const haze = ctx.createRadialGradient(x, y, 8, x, y, 105);
          haze.addColorStop(0, "rgba(190, 242, 250, 0.09)");
          haze.addColorStop(1, "rgba(135, 206, 220, 0)");
          ctx.fillStyle = haze;
          ctx.beginPath();
          ctx.arc(x, y, 105, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    drawPlayer() {
      const player = this.player;
      if (
        player.invincible > 0 &&
        player.sinceHit < 2 &&
        Math.floor(player.invincible * 14) % 2 === 0
      ) {
        return;
      }
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.tilt);

      if (player.burstTimer > 0) {
        const pulse = 38 + Math.sin(this.ambientTime * 20) * 5;
        ctx.strokeStyle = "rgba(151, 246, 255, 0.72)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, TAU);
        ctx.stroke();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#43ddff";
      const engineGlow = ctx.createRadialGradient(0, 29, 1, 0, 29, 24);
      engineGlow.addColorStop(0, "rgba(172, 249, 255, 0.9)");
      engineGlow.addColorStop(0.28, "rgba(50, 219, 255, 0.6)");
      engineGlow.addColorStop(1, "rgba(35, 181, 255, 0)");
      ctx.fillStyle = engineGlow;
      ctx.beginPath();
      ctx.ellipse(0, 29, 22, 11, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      const fighter = FIGHTERS[this.fighterId];
      const playerSprite = sprites[fighter.sprite];
      if (playerSprite.complete && playerSprite.naturalWidth > 0) {
        ctx.shadowBlur = 16;
        ctx.shadowColor =
          player.burstTimer > 0
            ? "#fff2a3"
            : this.fighterId === "dual"
              ? "#ff724f"
              : this.fighterId === "bomber"
                ? "#c66dff"
              : "#48dfff";
        if (this.fighterId === "laser") {
          ctx.drawImage(playerSprite, -31, -48, 62, 90);
        } else if (this.fighterId === "dual") {
          ctx.drawImage(playerSprite, -41, -43, 82, 86);
        } else if (this.fighterId === "bomber") {
          ctx.drawImage(playerSprite, -38, -49, 76, 94);
        } else {
          ctx.drawImage(playerSprite, -36, -40, 72, 80);
        }
      } else {
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#4fe6ff";
        ctx.fillStyle = "#d9f9ff";
        ctx.beginPath();
        ctx.moveTo(0, -27);
        ctx.lineTo(10, -5);
        ctx.lineTo(28, 16);
        ctx.lineTo(8, 11);
        ctx.lineTo(0, 24);
        ctx.lineTo(-8, 11);
        ctx.lineTo(-28, 16);
        ctx.lineTo(-10, -5);
        ctx.closePath();
        ctx.fill();
      }

      if (player.shield > 0 && player.invincible > 0) {
        ctx.strokeStyle = `rgba(117, 235, 255, ${0.35 + player.shield / 240})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 1, 37, 42, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPlayerLaser() {
      const player = this.player;
      if (this.fighterId === "dual") {
        this.drawDualPlayerLasers();
        return;
      }
      if (this.fighterId !== "laser" || !player.laserActive) return;
      const startY = player.y - 43;
      const endY = Math.min(startY - 4, player.laserEndY);
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const heatRatio = player.laserHeat / 100;
      const beamColor = heatRatio > 0.82 ? "#fff0a8" : "#75f4ff";
      const shimmer = Math.sin(this.ambientTime * 42) * 0.7;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = boosted ? 24 : 17;
      ctx.shadowColor = beamColor;
      ctx.strokeStyle = boosted ? "rgba(104, 231, 255, 0.32)" : "rgba(80, 219, 255, 0.25)";
      ctx.lineWidth = boosted ? 13 : 9;
      ctx.beginPath();
      ctx.moveTo(player.x + shimmer, startY);
      ctx.lineTo(player.x - shimmer, endY);
      ctx.stroke();
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = boosted ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(player.x + shimmer, startY);
      ctx.lineTo(player.x - shimmer, endY);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = boosted ? 2.4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(player.x, startY);
      ctx.lineTo(player.x, endY);
      ctx.stroke();
      ctx.restore();
    }

    drawDualPlayerLasers() {
      const player = this.player;
      if (!player.dualLaserActive) return;
      const startY = player.y - 37;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const x of [player.x - 11, player.x + 11]) {
        ctx.shadowBlur = boosted ? 22 : 16;
        ctx.shadowColor = "#ff7a42";
        ctx.strokeStyle = "rgba(255, 75, 42, 0.42)";
        ctx.lineWidth = boosted ? 10 : 7;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - 24);
        ctx.stroke();
        ctx.strokeStyle = "#ff9a43";
        ctx.lineWidth = boosted ? 4.5 : 3.2;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - 24);
        ctx.stroke();
        ctx.strokeStyle = "#fff5d6";
        ctx.lineWidth = boosted ? 2 : 1.3;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - 24);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawEnemies() {
      for (const enemy of this.enemies) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        if (this.weather.type === "mist" && enemy.flash <= 0) {
          ctx.globalAlpha = 0.32 + (Math.sin(enemy.age * 3.2 + enemy.phase) + 1) * 0.22;
        }
        if (enemy.flash > 0) {
          ctx.shadowBlur = 22;
          ctx.shadowColor = "#fff";
        }
        if (enemy.type === "scout") this.drawScout(enemy);
        else if (enemy.type === "sweeper") this.drawSweeper(enemy);
        else this.drawCharger(enemy);
        ctx.restore();
      }
    }

    drawScout(enemy) {
      ctx.rotate(Math.sin(enemy.age * 2 + enemy.phase) * 0.1);
      if (sprites.scout.complete && sprites.scout.naturalWidth > 0) {
        ctx.save();
        ctx.shadowBlur = enemy.flash > 0 ? 22 : 12;
        ctx.shadowColor = enemy.flash > 0 ? "#ffffff" : "#ff664f";
        if (enemy.flash > 0) ctx.filter = "brightness(2.35) saturate(0.35)";
        ctx.drawImage(sprites.scout, -20, -24, 40, 48);
        ctx.restore();
        return;
      }
      ctx.shadowBlur = 10;
      ctx.shadowColor = enemy.flash > 0 ? "#fff" : "#ff694f";
      const hull = ctx.createLinearGradient(-16, -16, 14, 18);
      hull.addColorStop(0, enemy.flash > 0 ? "#fff" : "#5f202b");
      hull.addColorStop(0.5, enemy.flash > 0 ? "#fff" : "#f28b67");
      hull.addColorStop(1, enemy.flash > 0 ? "#fff" : "#681d31");
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(7, 9);
      ctx.lineTo(19, 12);
      ctx.lineTo(13, -10);
      ctx.lineTo(6, -7);
      ctx.lineTo(0, -21);
      ctx.lineTo(-6, -7);
      ctx.lineTo(-13, -10);
      ctx.lineTo(-19, 12);
      ctx.lineTo(-7, 9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffb188";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#321826";
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(4, -6);
      ctx.lineTo(0, -13);
      ctx.lineTo(-4, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd986";
      ctx.beginPath();
      ctx.ellipse(0, 2, 2.7, 6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#66e8ff";
      ctx.shadowColor = "#66e8ff";
      ctx.fillRect(-11, -12, 4, 3);
      ctx.fillRect(7, -12, 4, 3);
    }

    drawSweeper(enemy) {
      if (sprites.sweeper.complete && sprites.sweeper.naturalWidth > 0) {
        ctx.save();
        ctx.shadowBlur = enemy.flash > 0 ? 22 : 13;
        ctx.shadowColor = enemy.flash > 0 ? "#ffffff" : "#c866ff";
        if (enemy.flash > 0) ctx.filter = "brightness(2.35) saturate(0.35)";
        ctx.drawImage(sprites.sweeper, -29, -26, 58, 55);
        ctx.restore();
        this.drawMiniHealth(enemy);
        return;
      }
      ctx.shadowBlur = 11;
      ctx.shadowColor = enemy.flash > 0 ? "#fff" : "#d36dff";
      const hull = ctx.createLinearGradient(-24, -18, 22, 22);
      hull.addColorStop(0, enemy.flash > 0 ? "#fff" : "#34254d");
      hull.addColorStop(0.52, enemy.flash > 0 ? "#fff" : "#a763ad");
      hull.addColorStop(1, enemy.flash > 0 ? "#fff" : "#261b3c");
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(10, 12);
      ctx.lineTo(25, 11);
      ctx.lineTo(29, -12);
      ctx.lineTo(12, -7);
      ctx.lineTo(0, -19);
      ctx.lineTo(-12, -7);
      ctx.lineTo(-29, -12);
      ctx.lineTo(-25, 11);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#d99df2";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#21162f";
      ctx.fillRect(-22, -7, 9, 12);
      ctx.fillRect(13, -7, 9, 12);
      ctx.strokeStyle = "#72dff3";
      ctx.beginPath();
      ctx.moveTo(-25, 3);
      ctx.lineTo(-13, 7);
      ctx.moveTo(25, 3);
      ctx.lineTo(13, 7);
      ctx.stroke();
      ctx.fillStyle = "#f3c8ff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 1, 7.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#522b6b";
      ctx.beginPath();
      ctx.arc(0, 1, 3.4, 0, TAU);
      ctx.fill();
      this.drawMiniHealth(enemy);
    }

    drawCharger(enemy) {
      if (enemy.state === "lock") {
        ctx.strokeStyle = `rgba(255, 92, 93, ${0.35 + Math.sin(enemy.age * 18) * 0.25})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 22);
        ctx.lineTo(this.player.x - enemy.x, HEIGHT - enemy.y);
        ctx.stroke();
      }
      if (sprites.charger.complete && sprites.charger.naturalWidth > 0) {
        ctx.save();
        ctx.shadowBlur = enemy.flash > 0 ? 22 : enemy.state === "lock" ? 18 : 11;
        ctx.shadowColor = enemy.flash > 0 ? "#ffffff" : "#ffb34f";
        if (enemy.flash > 0) ctx.filter = "brightness(2.35) saturate(0.35)";
        ctx.drawImage(sprites.charger, -18, -30, 36, 60);
        ctx.restore();
        this.drawMiniHealth(enemy);
        return;
      }
      ctx.shadowBlur = enemy.state === "lock" ? 18 : 9;
      ctx.shadowColor = enemy.flash > 0 ? "#fff" : "#ffb34f";
      const hull = ctx.createLinearGradient(-14, -20, 13, 24);
      hull.addColorStop(0, enemy.flash > 0 ? "#fff" : "#342d2a");
      hull.addColorStop(0.48, enemy.flash > 0 ? "#fff" : "#d69d4e");
      hull.addColorStop(1, enemy.flash > 0 ? "#fff" : "#4e2922");
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.lineTo(8, 13);
      ctx.lineTo(17, 6);
      ctx.lineTo(14, -21);
      ctx.lineTo(5, -12);
      ctx.lineTo(0, -18);
      ctx.lineTo(-5, -12);
      ctx.lineTo(-14, -21);
      ctx.lineTo(-17, 6);
      ctx.lineTo(-8, 13);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffe195";
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = "#282329";
      ctx.beginPath();
      ctx.moveTo(0, 21);
      ctx.lineTo(5, -9);
      ctx.lineTo(0, -14);
      ctx.lineTo(-5, -9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = enemy.state === "lock" ? "#fff2a0" : "#ff665c";
      ctx.shadowColor = "#ff724f";
      ctx.beginPath();
      ctx.arc(0, 3, 4.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#77e7ff";
      ctx.fillRect(-12, -17, 4, 3);
      ctx.fillRect(8, -17, 4, 3);
      this.drawMiniHealth(enemy);
    }

    drawMiniHealth(enemy) {
      const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.fillStyle = "rgba(1, 8, 15, 0.55)";
      ctx.fillRect(-19, -29, 38, 3);
      ctx.fillStyle = ratio > 0.35 ? "#76e8c0" : "#ff7b6b";
      ctx.fillRect(-19, -29, 38 * ratio, 3);
    }

    drawBoss() {
      const boss = this.boss;
      if (!boss) return;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      const mirage = boss.kind === "mirage";
      const glowPalettes = {
        yubo: ["#70e7ff", "#c17aff", "#ff5b91"],
        mirage: ["#70e7ff", "#64ffe0", "#f291ff"],
        gale: ["#9af5ff", "#ffd36e", "#fff2a0"],
        volt: ["#72f1ff", "#e7f45c", "#fff78d"],
      };
      const glow = glowPalettes[boss.kind][boss.phase - 1];
      ctx.shadowBlur = boss.flash > 0 ? 34 : 18;
      ctx.shadowColor = boss.flash > 0 ? "#fff" : glow;

      const bossSprites = {
        yubo: sprites.boss,
        mirage: sprites.bossMirage,
        gale: sprites.bossGale,
        volt: sprites.bossVolt,
      };
      const bossSprite = bossSprites[boss.kind];
      const spriteSizes = {
        yubo: [206, 149],
        mirage: [224, 158],
        gale: [220, 166],
        volt: [218, 188],
      };
      const [spriteWidth, spriteHeight] = spriteSizes[boss.kind];
      if (bossSprite.complete && bossSprite.naturalWidth > 0) {
        ctx.filter = boss.flash > 0 ? "brightness(2.1) saturate(0.35)" : "none";
        ctx.drawImage(
          bossSprite,
          -spriteWidth / 2,
          -spriteHeight / 2,
          spriteWidth,
          spriteHeight,
        );
        ctx.filter = "none";
      } else {
        ctx.fillStyle = boss.flash > 0 ? "#fff" : "#263e58";
        ctx.beginPath();
        ctx.moveTo(0, -58);
        ctx.lineTo(25, -34);
        ctx.lineTo(82, 11);
        ctx.lineTo(46, 8);
        ctx.lineTo(55, 42);
        ctx.lineTo(18, 31);
        ctx.lineTo(0, 56);
        ctx.lineTo(-18, 31);
        ctx.lineTo(-55, 42);
        ctx.lineTo(-46, 8);
        ctx.lineTo(-82, 11);
        ctx.lineTo(-25, -34);
        ctx.closePath();
        ctx.fill();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = glow;
      ctx.lineWidth = boss.phase === 3 ? 3.5 : 2.3;
      if (mirage) {
        [-22, 0, 22].forEach((x, index) => {
          ctx.beginPath();
          ctx.arc(x, 0, 8 + Math.sin(boss.age * 5 + index) * 1.5, boss.age, boss.age + Math.PI * 1.55);
          ctx.stroke();
        });
      } else if (boss.kind === "gale") {
        [-39, 39].forEach((x, index) => {
          ctx.beginPath();
          ctx.arc(x, -2, 18 + Math.sin(boss.age * 6 + index) * 2, boss.age * 1.8, boss.age * 1.8 + Math.PI * 1.45);
          ctx.stroke();
        });
      } else if (boss.kind === "volt") {
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(14, -7);
        ctx.lineTo(3, -2);
        ctx.lineTo(15, 22);
        ctx.lineTo(0, 10);
        ctx.lineTo(-15, 22);
        ctx.lineTo(-3, -2);
        ctx.lineTo(-14, -7);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, -4, 22 + Math.sin(boss.age * 4) * 2.5, boss.age, boss.age + Math.PI * 1.55);
        ctx.stroke();
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.35 + Math.sin(boss.age * 6) * 0.1;
        ctx.beginPath();
        ctx.arc(0, -4, 10, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }

    drawBullets() {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const bullet of this.playerBullets) {
        if (bullet.kind === "dualLaserBolt") {
          const length = bullet.length || 32;
          ctx.shadowBlur = 17;
          ctx.shadowColor = "#ff5b32";
          ctx.fillStyle = "rgba(255, 72, 38, 0.38)";
          ctx.fillRect(bullet.x - 5, bullet.y - length / 2, 10, length);
          ctx.fillStyle = "#ff9b45";
          ctx.fillRect(bullet.x - 2.5, bullet.y - length / 2, 5, length);
          ctx.fillStyle = "#fff7d9";
          ctx.fillRect(bullet.x - 0.8, bullet.y - length / 2, 1.6, length);
          continue;
        }
        ctx.shadowBlur = 11;
        ctx.shadowColor = "#58eaff";
        ctx.fillStyle = "#d8fcff";
        ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 13);
      }
      for (const bullet of this.enemyBullets) {
        ctx.shadowBlur = 9;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.beginPath();
        ctx.arc(bullet.x - 1, bullet.y - 1, bullet.radius * 0.35, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawPickups() {
      const colors = {
        repair: "#68f0b0",
        energy: "#6ceaff",
        overdrive: "#ff9d5c",
        score: "#ffe36d",
      };
      for (const pickup of this.pickups) {
        const color = colors[pickup.type];
        const pulse = 1 + Math.sin(pickup.age * 8) * 0.08;
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
        ctx.rotate(pickup.age * 1.8);
        ctx.scale(pulse, pulse);
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowBlur = 16;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.fillStyle = "rgba(5, 20, 30, 0.82)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = -Math.PI / 2 + (i / 6) * TAU;
          const x = Math.cos(angle) * 11;
          const y = Math.sin(angle) * 11;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.rotate(-pickup.age * 1.8);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.2;
        if (pickup.type === "repair") {
          ctx.fillRect(-1.7, -6, 3.4, 12);
          ctx.fillRect(-6, -1.7, 12, 3.4);
        } else if (pickup.type === "energy") {
          ctx.beginPath();
          ctx.moveTo(2, -7);
          ctx.lineTo(-4, 1);
          ctx.lineTo(0, 1);
          ctx.lineTo(-2, 7);
          ctx.lineTo(5, -2);
          ctx.lineTo(1, -2);
          ctx.closePath();
          ctx.fill();
        } else if (pickup.type === "overdrive") {
          for (let i = -1; i <= 1; i += 1) {
            ctx.beginPath();
            ctx.moveTo(-5, i * 4 + 2);
            ctx.lineTo(0, i * 4 - 2);
            ctx.lineTo(5, i * 4 + 2);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(6, 0);
          ctx.lineTo(0, 7);
          ctx.lineTo(-6, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    drawAirstrikes() {
      for (const strike of this.airstrikes) {
        ctx.save();
        ctx.translate(strike.x, strike.y);
        ctx.globalCompositeOperation = "lighter";
        if (!strike.struck) {
          const progress = clamp(strike.timer / strike.strikeAt, 0, 1);
          const radius = strike.radius * (1.18 - progress * 0.18);
          ctx.rotate(this.ambientTime * 2.8);
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -this.ambientTime * 18;
          ctx.strokeStyle = `rgba(221, 137, 255, ${0.35 + progress * 0.55})`;
          ctx.lineWidth = 1.8;
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#d07aff";
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.rotate(-this.ambientTime * 5.6);
          ctx.strokeStyle = `rgba(255, 222, 154, ${0.42 + progress * 0.45})`;
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 4; i += 1) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(radius - 13, 0);
            ctx.lineTo(radius + 4, 0);
            ctx.stroke();
          }
          ctx.fillStyle = `rgba(226, 151, 255, ${0.12 + progress * 0.18})`;
          ctx.beginPath();
          ctx.arc(0, 0, strike.radius * progress, 0, TAU);
          ctx.fill();
        } else {
          const progress = clamp(
            (strike.timer - strike.strikeAt) / (strike.duration - strike.strikeAt),
            0,
            1,
          );
          const radius = lerp(10, strike.radius * 1.2, Math.sqrt(progress));
          const blast = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
          blast.addColorStop(0, `rgba(255, 247, 211, ${0.88 * (1 - progress)})`);
          blast.addColorStop(0.28, `rgba(255, 151, 94, ${0.7 * (1 - progress)})`);
          blast.addColorStop(0.68, `rgba(192, 92, 255, ${0.42 * (1 - progress)})`);
          blast.addColorStop(1, "rgba(116, 58, 220, 0)");
          ctx.fillStyle = blast;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = `rgba(244, 190, 255, ${0.8 * (1 - progress)})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.84, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawLightningZones() {
      for (const zone of this.lightningZones) {
        const warning = zone.timer < zone.strikeAt;
        const alpha = warning ? 0.13 + Math.sin(zone.timer * 28) * 0.08 : 0.62;
        ctx.fillStyle = warning ? `rgba(255, 205, 82, ${alpha})` : `rgba(220, 251, 255, ${alpha})`;
        ctx.fillRect(zone.x - zone.width / 2, 0, zone.width, HEIGHT);
        ctx.strokeStyle = warning ? "rgba(255, 207, 89, 0.8)" : "#ffffff";
        ctx.lineWidth = warning ? 1.5 : 4;
        ctx.setLineDash(warning ? [10, 8] : []);
        ctx.strokeRect(zone.x - zone.width / 2, 1, zone.width, HEIGHT - 2);
        ctx.setLineDash([]);
        if (!warning) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = "#dffcff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          let lightningX = zone.x;
          ctx.moveTo(lightningX, -10);
          for (let y = 0; y < HEIGHT + 20; y += 35) {
            lightningX = zone.x + random(-zone.width * 0.3, zone.width * 0.3);
            ctx.lineTo(lightningX, y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    drawCorridorGate() {
      const gate = this.corridorGate;
      if (!gate) return;
      const active = gate.timer >= gate.strikeAt;
      const left = gate.centerX - gate.width / 2;
      const right = gate.centerX + gate.width / 2;
      const pulse = 0.1 + (Math.sin(gate.timer * 28) + 1) * 0.055;
      ctx.save();
      ctx.fillStyle = active ? "rgba(111, 238, 255, 0.38)" : `rgba(255, 196, 91, ${pulse})`;
      ctx.fillRect(0, 0, left, HEIGHT);
      ctx.fillRect(right, 0, WIDTH - right, HEIGHT);
      ctx.strokeStyle = active ? "#d7ffff" : "rgba(255, 215, 126, 0.82)";
      ctx.lineWidth = active ? 4 : 1.5;
      ctx.setLineDash(active ? [] : [12, 8]);
      ctx.beginPath();
      ctx.moveTo(left, 0);
      ctx.lineTo(left, HEIGHT);
      ctx.moveTo(right, 0);
      ctx.lineTo(right, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = active ? "rgba(167, 255, 255, 0.12)" : "rgba(85, 239, 255, 0.045)";
      ctx.fillRect(left, 0, gate.width, HEIGHT);
      ctx.restore();
    }

    drawGridHazards() {
      for (const hazard of this.gridHazards) {
        const active = hazard.timer >= hazard.strikeAt;
        const pulse = 0.08 + (Math.sin(hazard.timer * 30) + 1) * 0.055;
        const x = hazard.axis === "vertical" ? hazard.position - hazard.width / 2 : 0;
        const y = hazard.axis === "horizontal" ? hazard.position - hazard.width / 2 : 0;
        const width = hazard.axis === "vertical" ? hazard.width : WIDTH;
        const height = hazard.axis === "horizontal" ? hazard.width : HEIGHT;
        ctx.save();
        ctx.fillStyle = active ? "rgba(211, 244, 83, 0.34)" : `rgba(102, 239, 255, ${pulse})`;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = active ? "#f3ff9b" : "rgba(105, 239, 255, 0.84)";
        ctx.lineWidth = active ? 3 : 1.4;
        ctx.setLineDash(active ? [] : [8, 6]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
        if (active) {
          ctx.globalCompositeOperation = "lighter";
          ctx.beginPath();
          if (hazard.axis === "vertical") {
            let boltX = hazard.position;
            ctx.moveTo(boltX, -10);
            for (let boltY = 0; boltY < HEIGHT + 20; boltY += 30) {
              boltX = hazard.position + random(-hazard.width * 0.32, hazard.width * 0.32);
              ctx.lineTo(boltX, boltY);
            }
          } else {
            let boltY = hazard.position;
            ctx.moveTo(-10, boltY);
            for (let boltX = 0; boltX < WIDTH + 20; boltX += 30) {
              boltY = hazard.position + random(-hazard.width * 0.32, hazard.width * 0.32);
              ctx.lineTo(boltX, boltY);
            }
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawLockThreat() {
      const threat = this.lockThreat;
      if (!threat) return;
      const locked = threat.timer >= threat.lockAt;
      const fired = threat.fired;
      const progress = clamp(threat.timer / threat.fireAt, 0, 1);
      const radius = fired ? threat.radius * 1.7 : lerp(52, threat.radius, progress);
      ctx.save();
      ctx.translate(threat.x, threat.y);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = fired ? "#d9ffff" : locked ? "#ff5f6d" : "#ff9a72";
      ctx.lineWidth = fired ? 4 : 1.8;
      ctx.setLineDash(fired ? [] : [7, 5]);
      ctx.rotate(threat.timer * 1.8);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.rotate(-threat.timer * 3.6);
      for (let i = 0; i < 4; i += 1) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(radius - 7, 0);
        ctx.lineTo(radius + 7, 0);
        ctx.stroke();
      }
      if (locked && !fired) {
        ctx.fillStyle = "rgba(255, 73, 92, 0.16)";
        ctx.beginPath();
        ctx.arc(0, 0, threat.radius, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawParticles() {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const particle of this.particles) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      ctx.restore();
    }

    drawHud() {
      ctx.save();
      ctx.font = "700 11px 'Microsoft YaHei UI', sans-serif";
      ctx.textBaseline = "middle";

      this.drawHudPanel(12, 13, 145, 56);
      ctx.fillStyle = "#6f9bad";
      ctx.font = "700 8px 'Microsoft YaHei UI', sans-serif";
      ctx.fillText("SCORE", 23, 27);
      ctx.fillStyle = "#e4faff";
      ctx.font = "800 20px Consolas, monospace";
      ctx.fillText(formatScore(this.score), 22, 45);
      if (this.combo >= 2) {
        ctx.fillStyle = "#70efff";
        ctx.font = "800 10px 'Microsoft YaHei UI', sans-serif";
        ctx.fillText(`COMBO ×${Math.floor(this.combo)}`, 23, 61);
      }
      if (this.mode === "endless") {
        this.drawHudPanel(164, 13, 65, 56);
        ctx.fillStyle = "#b18ba9";
        ctx.font = "700 7px 'Microsoft YaHei UI', sans-serif";
        ctx.fillText("ENDLESS", 174, 26);
        ctx.fillStyle = "#fff0d6";
        ctx.font = "800 12px Consolas, monospace";
        ctx.fillText(formatTime(this.time), 174, 43);
        ctx.fillStyle = "#ffbd83";
        ctx.font = "800 8px 'Microsoft YaHei UI', sans-serif";
        ctx.fillText(`压力 ${this.endless.pressure}`, 174, 60);
      }

      this.drawHudPanel(12, HEIGHT - 73, 215, 57);
      ctx.fillStyle = "#7199aa";
      ctx.font = "700 8px 'Microsoft YaHei UI', sans-serif";
      ctx.fillText("护盾", 23, HEIGHT - 56);
      ctx.fillText("气象能量", 23, HEIGHT - 33);
      this.drawBar(76, HEIGHT - 60, 133, 8, this.player.shield / 100, "#5ce4ff");
      this.drawBar(76, HEIGHT - 37, 133, 8, this.player.energy / 100, "#ffd365");
      if (this.save.showShieldValue) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#e8fcff";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#1bbfdc";
        ctx.font = "800 7px Consolas, monospace";
        ctx.fillText(`${Math.ceil(this.player.shield)} / 100`, 142.5, HEIGHT - 56);
        ctx.restore();
      }
      if (this.fighterId === "laser") {
        this.drawHudPanel(12, HEIGHT - 96, 145, 17);
        ctx.fillStyle = this.player.laserCooling ? "#ffb06e" : "#7da8b8";
        ctx.font = "700 7px 'Microsoft YaHei UI', sans-serif";
        ctx.fillText(this.player.laserCooling ? "冷却" : "激光热量", 21, HEIGHT - 87);
        const heatColor =
          this.player.laserHeat > 82
            ? "#ffbd6b"
            : this.player.laserCooling
              ? "#ff896c"
              : "#70edff";
        this.drawBar(66, HEIGHT - 91, 81, 7, this.player.laserHeat / 100, heatColor);
      } else if (this.fighterId === "dual") {
        this.drawHudPanel(12, HEIGHT - 96, 145, 17);
        ctx.fillStyle = this.player.dualLaserActive ? "#ffd09b" : "#ff9672";
        ctx.font = "700 7px 'Microsoft YaHei UI', sans-serif";
        ctx.fillText("短束连发", 21, HEIGHT - 87);
        const interval =
          this.player.burstTimer > 0 || this.player.overdriveTimer > 0 ? 0.12 : 0.18;
        const cycleRatio = 1 - clamp(this.player.dualLaserFireTimer / interval, 0, 1);
        this.drawBar(
          66,
          HEIGHT - 91,
          81,
          7,
          cycleRatio,
          "#ff7048",
        );
      } else if (this.fighterId === "bomber") {
        this.drawHudPanel(12, HEIGHT - 96, 145, 17);
        const locking = this.airstrikes.some((strike) => !strike.struck);
        ctx.fillStyle = locking ? "#f1cbff" : "#bd8de1";
        ctx.font = "700 7px 'Microsoft YaHei UI', sans-serif";
        ctx.fillText(locking ? "轰炸锁定" : "轰炸装填", 21, HEIGHT - 87);
        const ratio = 1 - clamp(
          this.player.bombTimer / Math.max(0.01, this.player.bombInterval),
          0,
          1,
        );
        this.drawBar(66, HEIGHT - 91, 81, 7, ratio, "#c875ff");
      }

      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i < this.player.hull ? "#ff8e72" : "rgba(130, 155, 164, 0.22)";
        ctx.beginPath();
        ctx.moveTo(244 + i * 18, 24);
        ctx.lineTo(251 + i * 18, 31);
        ctx.lineTo(244 + i * 18, 40);
        ctx.lineTo(237 + i * 18, 31);
        ctx.closePath();
        ctx.fill();
      }

      const weatherWidth = 112;
      this.drawHudPanel(WIDTH - weatherWidth - 12, 51, weatherWidth, 34);
      ctx.fillStyle = "#7ba3b4";
      ctx.font = "700 7px 'Microsoft YaHei UI', sans-serif";
      ctx.fillText("WEATHER", WIDTH - weatherWidth, 62);
      ctx.fillStyle = "#d8f8ff";
      ctx.font = "700 10px 'Microsoft YaHei UI', sans-serif";
      const windArrow = Math.abs(this.weather.wind) > 8 ? (this.weather.wind > 0 ? "  →" : "  ←") : "";
      ctx.fillText(`${this.weather.label}${windArrow}`, WIDTH - weatherWidth, 76);

      if (this.boss) {
        const bossNames = {
          yubo: "积雨云母舰 · 雨伯",
          mirage: "隐云母舰 · 蜃影",
          gale: "风塔守卫 · 罡虎机",
          volt: "电网裁决舰 · 雷狱",
        };
        this.drawHudPanel(70, 212, WIDTH - 140, 31);
        ctx.fillStyle = "#bbd6df";
        ctx.font = "700 8px 'Microsoft YaHei UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bossNames[this.boss.kind], WIDTH / 2, 222);
        this.drawBar(86, 231, WIDTH - 172, 5, this.boss.hp / this.boss.maxHp, "#ff637e");
        ctx.textAlign = "left";
      }
      ctx.restore();

      const ready = this.player.energy >= 100 && this.state === "playing";
      ui.burstButton.classList.toggle("ready", ready);
    }

    drawPickupNotice() {
      if (!this.pickupNotice) return;
      const elapsed = this.pickupNotice.maxTimer - this.pickupNotice.timer;
      const alpha = Math.min(clamp(elapsed / 0.15, 0, 1), clamp(this.pickupNotice.timer / 0.3, 0, 1));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.font = "800 12px 'Microsoft YaHei UI', sans-serif";
      ctx.fillStyle = this.pickupNotice.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.pickupNotice.color;
      ctx.fillText(this.pickupNotice.label, WIDTH / 2, HEIGHT - 92 - elapsed * 8);
      ctx.restore();
    }

    drawHudPanel(x, y, width, height) {
      ctx.fillStyle = "rgba(3, 15, 27, 0.62)";
      ctx.strokeStyle = "rgba(104, 216, 250, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height - 6);
      ctx.lineTo(x + width - 6, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    drawBar(x, y, width, height, ratio, color) {
      ctx.fillStyle = "rgba(113, 160, 176, 0.16)";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width * clamp(ratio, 0, 1), height);
    }

    drawBanner() {
      if (!this.banner) return;
      const fadeIn = clamp((this.banner.maxTimer - this.banner.timer) / 0.35, 0, 1);
      const fadeOut = clamp(this.banner.timer / 0.45, 0, 1);
      const alpha = Math.min(fadeIn, fadeOut);
      ctx.save();
      ctx.globalAlpha = alpha;
      const y = 280;
      const gradient = ctx.createLinearGradient(30, 0, WIDTH - 30, 0);
      gradient.addColorStop(0, "rgba(5,17,29,0)");
      gradient.addColorStop(0.18, "rgba(5,17,29,0.82)");
      gradient.addColorStop(0.82, "rgba(5,17,29,0.82)");
      gradient.addColorStop(1, "rgba(5,17,29,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(20, y - 34, WIDTH - 40, 72);
      ctx.strokeStyle = "rgba(104, 229, 255, 0.48)";
      ctx.beginPath();
      ctx.moveTo(80, y - 33);
      ctx.lineTo(WIDTH - 80, y - 33);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#e4fbff";
      ctx.font = "800 19px 'Microsoft YaHei UI', sans-serif";
      ctx.fillText(this.banner.title, WIDTH / 2, y - 4);
      ctx.fillStyle = "#79b4c8";
      ctx.font = "600 9px 'Microsoft YaHei UI', sans-serif";
      ctx.fillText(this.banner.subtitle, WIDTH / 2, y + 19);
      ctx.restore();
    }

    getSnapshot() {
      return {
        state: this.state,
        mode: this.mode,
        level: this.level,
        time: Number(this.time.toFixed(2)),
        score: Math.floor(this.score),
        fighter: {
          id: this.fighterId,
          name: FIGHTERS[this.fighterId].name,
          weapon: FIGHTERS[this.fighterId].weapon,
            laserHeat: Math.round(this.player.laserHeat),
            laserCooling: this.player.laserCooling,
            laserActive: this.player.laserActive,
            dualLaserActive: this.player.dualLaserActive,
            dualLaserFireTimer: Number(this.player.dualLaserFireTimer.toFixed(2)),
            dualLaserCooldown: Number(this.player.dualLaserCooldown.toFixed(2)),
            bombTimer: Number(this.player.bombTimer.toFixed(2)),
            bombInterval: Number(this.player.bombInterval.toFixed(2)),
          },
        player: {
          hull: this.player.hull,
          shield: Math.round(this.player.shield),
          energy: Math.round(this.player.energy),
          overdrive: Number(this.player.overdriveTimer.toFixed(1)),
        },
        enemies: this.enemies.length,
        playerBullets: this.playerBullets.length,
        enemyBullets: this.enemyBullets.length,
        pickups: this.pickups.length,
        airstrikes: {
          active: this.airstrikes.length,
          pending: this.airstrikes.filter((strike) => !strike.struck).length,
          detonated: this.airstrikes.filter((strike) => strike.struck).length,
        },
        showShieldValue: this.save.showShieldValue,
        environment: this.environment,
        boss: this.boss
          ? {
              hp: Math.max(0, Math.round(this.boss.hp)),
              kind: this.boss.kind,
              phase: this.boss.phase,
              entered: this.boss.entered,
            }
          : null,
        weather: this.weather.type,
        endless:
          this.mode === "endless"
            ? {
                pressure: this.endless.pressure,
                sector: this.endless.sector,
                bossesDefeated: this.endless.bossesDefeated,
                nextBossIn: Number.isFinite(this.endless.nextBoss)
                  ? Number(Math.max(0, this.endless.nextBoss - this.time).toFixed(1))
                  : null,
              }
            : null,
      };
    }

    debugSkipToBoss() {
      if (this.mode === "endless") {
        if (this.state !== "playing") this.startEndless();
        this.enemies.length = 0;
        this.enemyBullets.length = 0;
        this.endless.nextBoss = this.time;
        this.updateEndlessDirector();
        this.player.shield = 100;
        this.player.hull = 3;
        this.player.energy = 100;
        return;
      }
      if (this.state !== "playing") this.start(this.level);
      const times = { 1: 68, 2: 57, 3: 58, 4: 58 };
      const bossWeather = {
        1: ["boss", "超胞雷暴", "yubo"],
        2: ["mirageBoss", "蜃影云场", "mirage"],
        3: ["galeBoss", "风塔共振", "gale"],
        4: ["voltBoss", "裁决电网", "volt"],
      };
      this.time = times[this.level];
      this.waveIndex = this.waves.length;
      this.enemies.length = 0;
      this.enemyBullets.length = 0;
      this.setWeather(bossWeather[this.level][0], 999, bossWeather[this.level][1]);
      this.spawnBoss(bossWeather[this.level][2]);
      this.player.shield = 100;
      this.player.hull = 3;
      this.player.energy = 100;
    }

    debugSpawnPickups() {
      if (this.state !== "playing") this.start();
      ["repair", "energy", "overdrive", "score"].forEach((type, index) => {
        this.spawnPickup(type, 150 + index * 50, this.player.y - 135, {
          vx: 0,
          vy: 25,
        });
      });
    }

    debugAdvanceEndless(seconds = 0) {
      if (this.mode !== "endless" || this.state !== "playing") this.startEndless();
      let remaining = clamp(Number(seconds) || 0, 0, 180);
      this.player.invincible = Math.max(this.player.invincible, remaining + 3);
      while (remaining > 0 && this.state === "playing") {
        const step = Math.min(0.033, remaining);
        this.update(step);
        remaining -= step;
      }
      return this.getSnapshot();
    }

    debugAdvanceWorld(seconds = 0) {
      if (this.state !== "playing") return this.getSnapshot();
      let remaining = clamp(Number(seconds) || 0, 0, 10);
      this.player.invincible = Math.max(this.player.invincible, remaining + 3);
      while (remaining > 0 && this.state === "playing") {
        const step = Math.min(0.033, remaining);
        this.update(step);
        remaining -= step;
      }
      return this.getSnapshot();
    }
  }

  const game = new Game();
  window.__FENGYUN_GAME__ = {
    snapshot: () => game.getSnapshot(),
    start: (level = 1) => game.start(level),
    startLevelTwo: () => game.start(2),
    startLevelThree: () => game.start(3),
    startLevelFour: () => game.start(4),
    startEndless: () => game.startEndless(),
    selectFighter: (fighterId) => game.selectFighter(fighterId),
    returnToHangar: () => game.returnToHangar(),
    advanceEndless: (seconds = 0) => game.debugAdvanceEndless(seconds),
    advanceWorld: (seconds = 0) => game.debugAdvanceWorld(seconds),
    endEndless: () => {
      if (game.mode === "endless" && game.state === "playing") game.finish(false);
      return game.getSnapshot();
    },
    skipToBoss: () => game.debugSkipToBoss(),
    spawnPickups: () => game.debugSpawnPickups(),
    spawnBombTargets: () => {
      game.enemies.length = 0;
      game.spawnEnemy("scout", 200, 180, { phase: 0 });
      game.spawnEnemy("scout", 225, 190, { phase: 0.4 });
      game.spawnEnemy("scout", 250, 180, { phase: 0.8 });
      game.player.bombTimer = 0;
      return game.getSnapshot();
    },
    chargeBurst: () => {
      game.player.energy = 100;
    },
    damageBoss: (amount = 500) => {
      if (game.boss) game.boss.hp -= Math.max(0, Number(amount) || 0);
    },
  };
})();
