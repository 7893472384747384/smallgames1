(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.combat = {
    fireAimed(x, y, speed, color) {
      const angle = Math.atan2(this.player.y - y, this.player.x - x);
      this.spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 5);
      this.audio.enemyShot();
    },

    fireFan(x, y, count, spread, speed, color) {
      const base = Math.atan2(this.player.y - y, this.player.x - x);
      for (let i = 0; i < count; i += 1) {
        const offset = (i - (count - 1) / 2) * spread;
        const angle = base + offset;
        this.spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 5);
      }
      this.audio.enemyShot();
    },

    fireRadial(x, y, count, speed, color, offset = 0) {
      for (let i = 0; i < count; i += 1) {
        const angle = offset + (i / count) * TAU;
        this.spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 4.5);
      }
      this.audio.enemyShot();
    },

    fireSpiral(x, y, step, color) {
      for (let arm = 0; arm < 3; arm += 1) {
        const angle = step * 0.34 + (arm / 3) * TAU;
        this.spawnEnemyBullet(x, y, Math.cos(angle) * 138, Math.sin(angle) * 138, color, 4.5);
      }
    },

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
    },

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
    },

    updateParticles(dt) {
      for (const particle of this.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.pow(0.96, dt * 60);
        particle.vy *= Math.pow(0.98, dt * 60);
        particle.life -= dt;
      }
      this.particles = this.particles.filter((particle) => particle.life > 0);
    },

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
    },

    damageEnemy(enemy, amount, environmental) {
      if (enemy.hp <= 0) return;
      enemy.hp -= amount;
      enemy.flash = 0.08;
      if (enemy.hp <= 0) {
        this.explodeEnemy(enemy, environmental);
      } else if (Math.random() < 0.25) {
        this.spawnSpark(enemy.x + random(-8, 8), enemy.y + random(-8, 8), "#9cefff", 0.45);
      }
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },
  };
})();
