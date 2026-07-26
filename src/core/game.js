(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, BALANCE, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData, loadSave, SynthAudio } = FY;

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
      for (const [fighterId, button] of Object.entries(ui.fighterButtons)) {
        button.addEventListener("click", () => this.selectFighter(fighterId));
      }
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
        bombInterval: BALANCE.bomber.interval,
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
      for (const [fighterId, button] of Object.entries(ui.fighterButtons)) {
        const selected = this.fighterId === fighterId;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
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
            player.burstTimer > 0
              ? BALANCE.pulse.burstInterval
              : player.overdriveTimer > 0
                ? BALANCE.pulse.overdriveInterval
                : BALANCE.pulse.interval;
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

  for (const mixin of Object.values(FY.mixins)) Object.assign(Game.prototype, mixin);
  FY.Game = Game;
})();
