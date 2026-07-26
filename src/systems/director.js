(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.director = {
    buildWaves() {
      if (this.mode === "endless") return [];
      if (this.level === 2) return this.buildLevelTwoWaves();
      if (this.level === 3) return this.buildLevelThreeWaves();
      if (this.level === 4) return this.buildLevelFourWaves();
      if (this.level === 5) return this.buildLevelFiveWaves();
      if (this.level === 6) return this.buildLevelSixWaves();
      return this.buildLevelOneWaves();
    },

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
    },

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
    },

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
    },

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
    },

    buildLevelFiveWaves() {
      return [
        { at: 0.5, run: () => this.showBanner("F-05 怒海孤航", "正在越过远海岛链", 3.2) },
        { at: 2.5, run: () => this.spawnScoutV(8) },
        { at: 7, run: () => this.spawnSweepers(4) },
        {
          at: 11,
          run: () => {
            this.setWeather("tide", 13, "横向涌浪");
            this.showBanner("涌浪预警", "避开横向亮带，浪峰也会冲击敌机", 3);
          },
        },
        { at: 12, run: () => this.spawnChargers(4) },
        { at: 18, run: () => this.spawnScoutColumns(true) },
        { at: 23, run: () => this.spawnMixedWave() },
        {
          at: 28,
          run: () => {
            this.setWeather("squall", 14, "海上飑线");
            this.showBanner("飑线过境", "横风与双重涌浪正在接近", 2.8);
          },
        },
        { at: 29, run: () => this.spawnSweepers(5) },
        { at: 35, run: () => this.spawnChargers(5) },
        { at: 41, run: () => this.spawnScoutV(11) },
        {
          at: 46,
          run: () => {
            this.setWeather("tide", 14, "离岸逆潮");
            this.spawnMixedWave();
          },
        },
        { at: 52, run: () => this.spawnSweepers(6) },
        { at: 58, run: () => this.spawnChargers(5) },
        {
          at: 65,
          run: () => {
            this.setWeather("tideBoss", 999, "玄潮共振");
            this.spawnBoss("tide");
          },
        },
      ];
    },

    buildLevelSixWaves() {
      return [
        { at: 0.5, run: () => this.showBanner("F-06 山河险渡", "沿峡谷河道低空突入", 3.2) },
        { at: 2.5, run: () => this.spawnScoutColumns(true) },
        { at: 7, run: () => this.spawnChargers(4) },
        {
          at: 11,
          run: () => {
            this.setWeather("rockfall", 13, "山体落石");
            this.showBanner("落石警告", "红圈停止追踪后立即离开冲击区", 3);
          },
        },
        { at: 12, run: () => this.spawnSweepers(5) },
        { at: 18, run: () => this.spawnScoutV(10) },
        { at: 23, run: () => this.spawnMixedWave() },
        {
          at: 28,
          run: () => {
            this.setWeather("mountainStorm", 15, "峡谷横岚");
            this.showBanner("山风合流", "横风与连续落石将同时出现", 2.9);
          },
        },
        { at: 29, run: () => this.spawnChargers(5) },
        { at: 35, run: () => this.spawnSweepers(6) },
        { at: 41, run: () => this.spawnScoutColumns(true) },
        {
          at: 47,
          run: () => {
            this.setWeather("rockfall", 14, "断崖崩落");
            this.spawnMixedWave();
          },
        },
        { at: 53, run: () => this.spawnChargers(6) },
        { at: 59, run: () => this.spawnSweepers(6) },
        {
          at: 67,
          run: () => {
            this.setWeather("ridgeBoss", 999, "山河封锁");
            this.spawnBoss("ridge");
          },
        },
      ];
    },

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

      if (this.time >= this.endless.nextUpgrade && !this.boss) {
        this.offerEndlessUpgrade();
        return;
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
    },

    offerEndlessUpgrade() {
      if (this.state !== "playing" || this.mode !== "endless") return;
      const catalog = [
        { id: "damage", name: "高能弹舱", copy: "所有武器伤害 +20%" },
        { id: "shield", name: "自愈装甲", copy: "护盾自动恢复速度 +35%" },
        { id: "speed", name: "矢量推进", copy: "战机移动速度 +12%" },
        { id: "graze", name: "近弹感应", copy: "擦弹获得的气象能量 +40%" },
        { id: "magnet", name: "广域牵引", copy: "道具吸附范围 +40%" },
        { id: "amplifier", name: "核心增容", copy: "倍增核心单次持续时间 +2秒" },
      ];
      const start = (this.endless.upgradeCount * 2) % catalog.length;
      this.endless.offeredUpgrades = [0, 1, 2].map(
        (offset) => catalog[(start + offset) % catalog.length],
      );
      ui.upgradeButtons.forEach((button, index) => {
        const upgrade = this.endless.offeredUpgrades[index];
        button.innerHTML = `<strong>${upgrade.name}</strong><small>${upgrade.copy}</small>`;
      });
      this.state = "upgrade";
      ui.upgradePanel.classList.add("visible");
    },

    chooseEndlessUpgrade(index) {
      if (this.state !== "upgrade" || this.mode !== "endless") return false;
      const upgrade = this.endless.offeredUpgrades[index];
      if (!upgrade) return false;
      if (upgrade.id === "damage") this.player.damageScale *= 1.2;
      else if (upgrade.id === "shield") this.player.shieldRegenScale *= 1.35;
      else if (upgrade.id === "speed") this.player.speedScale *= 1.12;
      else if (upgrade.id === "graze") this.player.grazeEnergyScale *= 1.4;
      else if (upgrade.id === "magnet") this.player.magnetScale *= 1.4;
      else if (upgrade.id === "amplifier") this.player.amplifierDurationBonus += 2;
      this.endless.upgrades.push(upgrade.id);
      this.endless.upgradeCount += 1;
      this.endless.nextUpgrade += 60;
      this.endless.offeredUpgrades = [];
      ui.upgradePanel.classList.remove("visible");
      this.state = "playing";
      this.lastFrame = performance.now();
      this.showBanner("改造完成", upgrade.name, 2);
      return true;
    },

    getEndlessDifficulty() {
      return {
        pressure: Math.floor(this.time / 30) + 1,
        hpScale: 1 + Math.min(2.4, this.time / 240),
        speedScale: 1 + Math.min(0.45, this.time / 600),
        bulletScale: 1 + Math.min(0.5, this.time / 600),
      };
    },

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
        oceanFront: "远海岛链",
        riverValley: "山河峡谷",
      }[environment];
    },

    spawnEndlessWave() {
      const pressure = this.endless.pressure;
      const pattern = (Math.floor(this.time / 4) + pressure) % 7;
      if (pattern === 0) {
        this.spawnScoutV(Math.min(12, 5 + pressure));
      } else if (pattern === 1) {
        this.spawnSweepers(Math.min(7, 2 + Math.ceil(pressure / 2)));
      } else if (pattern === 2) {
        this.spawnChargers(Math.min(6, 1 + Math.ceil(pressure / 3)));
      } else if (pattern === 3) {
        this.spawnScoutColumns(pressure >= 3);
      } else if (pattern === 4) {
        this.spawnMixedWave();
      } else if (pattern === 5) {
        this.spawnEnemy(pressure >= 5 ? "medic" : "guardian", random(70, WIDTH - 70), -55);
        this.spawnScoutV(Math.min(8, 3 + pressure));
      } else {
        this.spawnEnemy(pressure >= 7 ? "carrier" : "minelayer", random(70, WIDTH - 70), -60);
      }

      if (pressure >= 6 && pattern % 2 === 0 && this.enemies.length < 20) {
        this.spawnEnemy("sweeper", random(65, WIDTH - 65), -70, {
          phase: this.time,
          hpScale: 1.15,
        });
      }
    },

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
    },

    spawnEndlessBoss() {
      const index = this.endless.bossesDefeated % ENDLESS_BOSSES.length;
      const kind = ENDLESS_BOSSES[index];
      const weather = {
        yubo: ["boss", "超胞雷暴"],
        mirage: ["mirageBoss", "蜃影云场"],
        gale: ["galeBoss", "风塔共振"],
        volt: ["voltBoss", "裁决电网"],
        tide: ["tideBoss", "玄潮共振"],
        ridge: ["ridgeBoss", "山河封锁"],
      }[kind];
      this.setWeather(weather[0], 999, weather[1]);
      this.spawnBoss(kind);
      const hpScale = 1 + Math.min(2.5, this.time / 300);
      this.boss.hp = Math.round(this.boss.hp * hpScale);
      this.boss.maxHp = this.boss.hp;
      this.boss.parts.forEach((part) => {
        part.hp = Math.round(part.hp * hpScale);
        part.maxHp = part.hp;
      });
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
    },

    spawnScoutV(count) {
      for (let i = 0; i < count; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        const rank = Math.ceil(i / 2);
        this.spawnEnemy("scout", WIDTH / 2 + side * rank * 52, -35 - rank * 32, {
          phase: i * 0.45,
        });
      }
    },

    spawnScoutColumns(reinforced = false) {
      [72, WIDTH - 72].forEach((x, column) => {
        for (let i = 0; i < (reinforced ? 4 : 3); i += 1) {
          this.spawnEnemy("scout", x, -35 - i * 72 - column * 25, {
            phase: i + column,
            hpScale: reinforced ? 1.3 : 1,
          });
        }
      });
    },

    spawnSweepers(count) {
      for (let i = 0; i < count; i += 1) {
        this.spawnEnemy("sweeper", 55 + (i * (WIDTH - 110)) / Math.max(1, count - 1), -45 - i * 30, {
          phase: i * 0.9,
        });
      }
    },

    spawnChargers(count) {
      for (let i = 0; i < count; i += 1) {
        this.spawnEnemy("charger", 70 + (i * (WIDTH - 140)) / Math.max(1, count - 1), -55 - i * 62, {
          phase: i * 0.55,
        });
      }
    },

    spawnMixedWave() {
      this.spawnEnemy("sweeper", 82, -45, { phase: 0.2 });
      this.spawnEnemy("sweeper", WIDTH - 82, -75, { phase: 1.1 });
      this.spawnEnemy("charger", WIDTH / 2, -120, { phase: 0.6 });
      for (let i = 0; i < 4; i += 1) {
        this.spawnEnemy("scout", 60 + i * 110, -180 - i * 35, { phase: i });
      }
      if (this.level >= 2 && this.mode !== "endless") {
        const specialist = ["guardian", "medic", "minelayer", "carrier"][
          Math.min(3, this.level - 2)
        ];
        this.spawnEnemy(specialist, WIDTH / 2, -235, { phase: this.level });
      }
    },

    spawnEnemy(type, x, y, options = {}) {
      const stats = {
        scout: { radius: 15, hp: 32, speed: 72, score: 120, fireRate: 1.8 },
        sweeper: { radius: 20, hp: 70, speed: 52, score: 250, fireRate: 2.15 },
        charger: { radius: 18, hp: 92, speed: 46, score: 340, fireRate: 3.1 },
        guardian: { radius: 22, hp: 125, speed: 38, score: 440, fireRate: 2.8 },
        medic: { radius: 19, hp: 88, speed: 42, score: 410, fireRate: 3.2 },
        minelayer: { radius: 21, hp: 108, speed: 40, score: 460, fireRate: 2.4 },
        carrier: { radius: 25, hp: 165, speed: 32, score: 560, fireRate: 4.2 },
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
        supportTimer: random(1.2, 2.4),
      });
      this.runStats.spawned += 1;
    },

    spawnBoss(
      kind = { 1: "yubo", 2: "mirage", 3: "gale", 4: "volt", 5: "tide", 6: "ridge" }[
        this.level
      ],
    ) {
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
        tide: {
          radius: 70,
          hp: 3550,
          summonTimer: 4.2,
          intro: "深海母舰跃出风暴潮",
          name: "潮汐母舰 · 玄鲸",
        },
        ridge: {
          radius: 72,
          hp: 3900,
          summonTimer: 4,
          intro: "山河要塞解除岩层伪装",
          name: "山河要塞 · 岚蛟",
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
        parts: [
          {
            id: "left",
            label: "左武装",
            xOffset: -stats.radius * 0.68,
            yOffset: 8,
            radius: 15,
            hp: Math.round(stats.hp * 0.085),
            maxHp: Math.round(stats.hp * 0.085),
            destroyed: false,
            flash: 0,
          },
          {
            id: "right",
            label: "右武装",
            xOffset: stats.radius * 0.68,
            yOffset: 8,
            radius: 15,
            hp: Math.round(stats.hp * 0.085),
            maxHp: Math.round(stats.hp * 0.085),
            destroyed: false,
            flash: 0,
          },
        ],
      };
      this.showBanner(stats.intro, stats.name, 3.4);
    },
  };
})();
