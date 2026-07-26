(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.hazards = {
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
      this.weather.nextTide = ["tide", "squall", "tideBoss"].includes(type) ? 1.35 : 999;
      this.weather.nextRock = ["rockfall", "mountainStorm", "ridgeBoss"].includes(type)
        ? 1.25
        : 999;
      if (
        type === "wind" ||
        type === "storm" ||
        type === "jetstream" ||
        type === "towerWind" ||
        type === "reverseGale" ||
        type === "galeBoss"
        || type === "squall"
        || type === "mountainStorm"
      ) {
        this.weather.targetWind = random(35, 58) * (Math.random() < 0.5 ? -1 : 1);
      } else {
        this.weather.targetWind = 0;
      }
    },

    updateWeather(dt) {
      this.weather.timer -= dt;
      this.weather.nextShift -= dt;
      this.weather.nextLightning -= dt;
      this.weather.nextLock -= dt;
      this.weather.nextCorridor -= dt;
      this.weather.nextGrid -= dt;
      this.weather.nextTide -= dt;
      this.weather.nextRock -= dt;

      if (
        this.weather.timer <= 0 &&
        this.weather.type !== "clear" &&
        this.weather.type !== "boss" &&
        this.weather.type !== "mirageBoss" &&
        this.weather.type !== "galeBoss" &&
        this.weather.type !== "voltBoss"
        && this.weather.type !== "tideBoss"
        && this.weather.type !== "ridgeBoss"
      ) {
        const calmWeather = {
          1: "高空晴朗",
          2: "云海静流",
          3: "回廊顺风",
          4: "电网待机",
          5: "远海长涌",
          6: "河谷清岚",
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
        || this.weather.type === "squall"
        || this.weather.type === "mountainStorm"
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

      if (
        ["tide", "squall", "tideBoss"].includes(this.weather.type) &&
        this.weather.nextTide <= 0
      ) {
        this.createTideSurge();
        if (this.weather.type === "squall" && Math.random() < 0.38) this.createTideSurge();
        this.weather.nextTide =
          this.weather.type === "tideBoss" ? random(2.2, 2.9) : random(3.1, 4.1);
      }

      if (
        ["rockfall", "mountainStorm", "ridgeBoss"].includes(this.weather.type) &&
        this.weather.nextRock <= 0
      ) {
        this.createRockfall();
        if (this.weather.type === "mountainStorm" && Math.random() < 0.42) {
          this.createRockfall(random(55, WIDTH - 55), random(180, HEIGHT - 125));
        }
        this.weather.nextRock =
          this.weather.type === "ridgeBoss" ? random(2, 2.7) : random(2.8, 3.8);
      }

      this.updateLockThreat(dt);
      this.updateCorridorGate(dt);
      this.updateGridHazards(dt);
      this.updateTideSurges(dt);
      this.updateRockfalls(dt);
    },

    createTideSurge(y = clamp(this.player.y + random(-145, 85), 160, HEIGHT - 110)) {
      this.tideSurges.push({
        y,
        height: 64,
        timer: 0,
        strikeAt: 0.92,
        duration: 1.38,
        struck: false,
        direction: Math.random() < 0.5 ? -1 : 1,
      });
    },

    updateTideSurges(dt) {
      for (const surge of this.tideSurges) {
        surge.timer += dt;
        if (!surge.struck && surge.timer >= surge.strikeAt) {
          surge.struck = true;
          const hit = (target) =>
            Math.abs(target.y - surge.y) < surge.height / 2 + target.radius;
          if (hit(this.player)) {
            this.hurtPlayer();
            this.player.x = clamp(this.player.x + surge.direction * 38, 18, WIDTH - 18);
          }
          this.enemies.forEach((enemy) => {
            if (hit(enemy)) this.damageEnemy(enemy, 62, true);
          });
          if (this.boss && hit(this.boss)) {
            this.boss.hp -= 38;
            this.boss.flash = 0.16;
          }
          this.screenFlash = Math.max(this.screenFlash, 0.13);
          this.shake = Math.max(this.shake, 7);
        }
      }
      this.tideSurges = this.tideSurges.filter((surge) => surge.timer < surge.duration);
    },

    createRockfall(x = this.player.x, y = this.player.y) {
      this.rockfalls.push({
        x: clamp(x, 45, WIDTH - 45),
        y: clamp(y, 145, HEIGHT - 90),
        radius: 46,
        timer: 0,
        lockAt: 0.42,
        strikeAt: 0.98,
        duration: 1.42,
        struck: false,
      });
    },

    updateRockfalls(dt) {
      for (const rock of this.rockfalls) {
        rock.timer += dt;
        if (rock.timer < rock.lockAt) {
          rock.x = lerp(rock.x, this.player.x, 1 - Math.exp(-dt * 7));
          rock.y = lerp(rock.y, this.player.y, 1 - Math.exp(-dt * 7));
        }
        if (!rock.struck && rock.timer >= rock.strikeAt) {
          rock.struck = true;
          const hit = (target) =>
            distanceSquared(rock, target) < (rock.radius + target.radius) ** 2;
          if (hit(this.player)) this.hurtPlayer();
          this.enemies.forEach((enemy) => {
            if (hit(enemy)) this.damageEnemy(enemy, 68, true);
          });
          if (this.boss && hit(this.boss)) {
            this.boss.hp -= 42;
            this.boss.flash = 0.16;
          }
          this.screenFlash = Math.max(this.screenFlash, 0.15);
          this.shake = Math.max(this.shake, 9);
          for (let i = 0; i < 22; i += 1) {
            this.spawnSpark(rock.x, rock.y, i % 2 ? "#bde07a" : "#d2a46c", 0.9);
          }
        }
      }
      this.rockfalls = this.rockfalls.filter((rock) => rock.timer < rock.duration);
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

    createLightningZone(x, width = 52) {
      this.lightningZones.push({
        x,
        width,
        timer: 0,
        strikeAt: 0.92,
        duration: 1.28,
        struck: false,
      });
    },

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
    },
  };
})();
