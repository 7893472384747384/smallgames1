(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, BALANCE, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.weapons = {
    firePlayerWeapon() {
      const boosted = this.player.burstTimer > 0 || this.player.overdriveTimer > 0;
      this.playerBullets.push(
        {
          x: this.player.x - 7,
          y: this.player.y - 29,
          vx: boosted ? -55 : -18,
          vy: -BALANCE.pulse.speed,
          radius: 3,
          damage: boosted ? BALANCE.pulse.boostedDamage : BALANCE.pulse.damage,
          life: 1.7,
        },
        {
          x: this.player.x + 7,
          y: this.player.y - 29,
          vx: boosted ? 55 : 18,
          vy: -BALANCE.pulse.speed,
          radius: 3,
          damage: boosted ? BALANCE.pulse.boostedDamage : BALANCE.pulse.damage,
          life: 1.7,
        },
      );
      this.audio.shot();
    },

    updateLaserWeapon(dt) {
      const player = this.player;
      player.laserSparkTimer = Math.max(0, player.laserSparkTimer - dt);
      player.laserAudioTimer = Math.max(0, player.laserAudioTimer - dt);

      if (player.laserCooling) {
        player.laserActive = false;
        player.laserHeat = Math.max(0, player.laserHeat - dt * BALANCE.laser.coolingPerSecond);
        if (player.laserHeat <= BALANCE.laser.resumeHeat) player.laserCooling = false;
        return;
      }

      player.laserActive = true;
      player.laserHeat = Math.min(100, player.laserHeat + dt * BALANCE.laser.heatPerSecond);
      if (player.laserHeat >= 100) {
        player.laserCooling = true;
        player.laserActive = false;
        this.audio.tone(240, 0.18, "sawtooth", 0.018, -70);
        return;
      }

      const target = this.findLaserTarget(player.x);

      player.laserEndY = target ? target.y + target.radius * 0.72 : 0;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const damage =
        (boosted ? BALANCE.laser.boostedDamagePerSecond : BALANCE.laser.damagePerSecond) * dt;
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
    },

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
    },

    damageLaserTarget(target, damage) {
      if (!target) return;
      if (target === this.boss) {
        target.hp -= damage;
        target.flash = 0.055;
      } else {
        this.damageEnemy(target, damage, false);
      }
    },

    updateDualLaserWeapon(dt) {
      const player = this.player;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const interval = boosted ? BALANCE.dual.boostedInterval : BALANCE.dual.interval;
      player.dualLaserFireTimer -= dt;
      player.dualLaserCooldown = Math.max(0, player.dualLaserCooldown - dt);
      player.dualLaserActive = player.dualLaserCooldown > 0;
      if (player.dualLaserFireTimer > 0) return;

      const damage = boosted ? BALANCE.dual.boostedDamage : BALANCE.dual.damage;
      const speed = -(boosted ? BALANCE.dual.boostedSpeed : BALANCE.dual.speed);
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
          length: boosted ? BALANCE.dual.boostedLength : BALANCE.dual.length,
        });
      }
      player.dualLaserActive = true;
      player.dualLaserCooldown = 0.055;
      player.dualLaserFireTimer += interval;
      this.audio.tone(boosted ? 790 : 650, 0.045, "square", 0.009, 130);
    },

    updateBomberWeapon(dt) {
      const player = this.player;
      const boosted = player.burstTimer > 0 || player.overdriveTimer > 0;
      const interval = boosted ? BALANCE.bomber.boostedInterval : BALANCE.bomber.interval;
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
        radius: boosted ? BALANCE.bomber.boostedRadius : BALANCE.bomber.radius,
        damage: boosted ? BALANCE.bomber.boostedDamage : BALANCE.bomber.damage,
        timer: 0,
        strikeAt: BALANCE.bomber.lockDelay,
        duration: 0.72,
        struck: false,
      });
      player.bombTimer += interval;
      this.audio.tone(420, 0.07, "triangle", 0.014, 180);
    },

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
      const clusterRadiusSq = BALANCE.bomber.radius * BALANCE.bomber.radius;
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
    },

    updateAirstrikes(dt) {
      for (const strike of this.airstrikes) {
        strike.timer += dt;
        if (!strike.struck && strike.timer >= strike.strikeAt) {
          strike.struck = true;
          this.detonateAirstrike(strike);
        }
      }
      this.airstrikes = this.airstrikes.filter((strike) => strike.timer < strike.duration);
    },

    detonateAirstrike(strike) {
      this.shake = Math.max(this.shake, 5);
      this.screenFlash = Math.max(this.screenFlash, 0.09);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const reach = strike.radius + enemy.radius * 0.35;
        const distance = Math.sqrt(distanceSquared(strike, enemy));
        if (distance > reach) continue;
        const falloff = lerp(
          1,
          BALANCE.bomber.edgeDamageRatio,
          clamp(distance / reach, 0, 1),
        );
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
    },
  };
})();
