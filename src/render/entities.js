(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.entities = {
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
      if (player.amplifierTimer > 0) {
        const pulse = 42 + Math.sin(this.ambientTime * 13) * 4;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(255, 190, 86, 0.78)";
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#ff8c46";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -this.ambientTime * 22;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, TAU);
        ctx.stroke();
        ctx.restore();
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
          player.amplifierTimer > 0
            ? "#ffad54"
            : player.burstTimer > 0
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
    },

    drawPlayerLaser() {
      const player = this.player;
      if (this.fighterId === "dual") {
        this.drawDualPlayerLasers();
        return;
      }
      if (this.fighterId !== "laser" || !player.laserActive) return;
      const startY = player.y - 43;
      const beams = player.laserBeams.length
        ? player.laserBeams
        : [{ x: player.x, endY: player.laserEndY }];
      const boosted =
        player.burstTimer > 0 || player.overdriveTimer > 0 || player.amplifierTimer > 0;
      const heatRatio = player.laserHeat / 100;
      const beamColor = heatRatio > 0.82 ? "#fff0a8" : "#75f4ff";
      const shimmer = Math.sin(this.ambientTime * 42) * 0.7;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = boosted ? 24 : 17;
      ctx.shadowColor = beamColor;
      for (const beam of beams) {
        const endY = Math.min(startY - 4, beam.endY);
        ctx.strokeStyle = boosted
          ? "rgba(104, 231, 255, 0.32)"
          : "rgba(80, 219, 255, 0.25)";
        ctx.lineWidth = boosted ? 13 : 9;
        ctx.beginPath();
        ctx.moveTo(beam.x + shimmer, startY);
        ctx.lineTo(beam.x - shimmer, endY);
        ctx.stroke();
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = boosted ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(beam.x + shimmer, startY);
        ctx.lineTo(beam.x - shimmer, endY);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = boosted ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(beam.x, startY);
        ctx.lineTo(beam.x, endY);
        ctx.stroke();
      }
      ctx.restore();
    },

    drawDualPlayerLasers() {
      const player = this.player;
      if (!player.dualLaserActive) return;
      const startY = player.y - 37;
      const boosted =
        player.burstTimer > 0 || player.overdriveTimer > 0 || player.amplifierTimer > 0;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const beamXs =
        player.amplifierTimer > 0
          ? [player.x - 27, player.x - 9, player.x + 9, player.x + 27]
          : [player.x - 11, player.x + 11];
      for (const x of beamXs) {
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
    },

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
        else if (enemy.type === "charger") this.drawCharger(enemy);
        else this.drawFunctionalEnemy(enemy);
        ctx.restore();
      }
    },

    drawFunctionalEnemy(enemy) {
      ctx.save();
      const palette = {
        guardian: "#69e8ff",
        medic: "#72f0a4",
        minelayer: "#ff9a68",
        carrier: "#ffc56d",
      }[enemy.type];
      ctx.globalAlpha = 0.88;
      if (enemy.type === "medic") {
        ctx.scale(0.95, 0.95);
        this.drawScout(enemy);
      } else {
        ctx.scale(enemy.type === "carrier" ? 1.12 : 0.94, enemy.type === "carrier" ? 1.12 : 0.94);
        this.drawSweeper(enemy);
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = palette;
      ctx.fillStyle = palette;
      ctx.shadowBlur = 12;
      ctx.shadowColor = palette;
      ctx.lineWidth = 1.7;
      if (enemy.type === "guardian") {
        ctx.globalAlpha = 0.55 + Math.sin(enemy.age * 5) * 0.12;
        ctx.beginPath();
        ctx.arc(0, 0, 29, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 23, -0.8, 0.8);
        ctx.stroke();
      } else if (enemy.type === "medic") {
        ctx.fillRect(-2, -10, 4, 20);
        ctx.fillRect(-10, -2, 20, 4);
      } else if (enemy.type === "minelayer") {
        for (let i = 0; i < 6; i += 1) {
          ctx.rotate(TAU / 6);
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(25, 0);
          ctx.stroke();
        }
      } else {
        ctx.strokeRect(-16, -7, 32, 14);
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
      }
      ctx.restore();
      this.drawMiniHealth(enemy);
    },

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
    },

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
    },

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
    },

    drawMiniHealth(enemy) {
      const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.fillStyle = "rgba(1, 8, 15, 0.55)";
      ctx.fillRect(-19, -29, 38, 3);
      ctx.fillStyle = ratio > 0.35 ? "#76e8c0" : "#ff7b6b";
      ctx.fillRect(-19, -29, 38 * ratio, 3);
    },

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
        tide: ["#6cf5ff", "#5db8ff", "#a8faff"],
        ridge: ["#a7e870", "#d5ad65", "#e8ff9b"],
        chiji: ["#ffb35d", "#ff744f", "#fff09a"],
        kuilong: ["#9aeaff", "#b27aff", "#f2d8ff"],
      };
      const glow = glowPalettes[boss.kind][boss.phase - 1];
      ctx.shadowBlur = boss.flash > 0 ? 34 : 18;
      ctx.shadowColor = boss.flash > 0 ? "#fff" : glow;

      const bossSprites = {
        yubo: sprites.boss,
        mirage: sprites.bossMirage,
        gale: sprites.bossGale,
        volt: sprites.bossVolt,
        tide: sprites.bossTide,
        ridge: sprites.bossRidge,
        chiji: sprites.bossChiji,
        kuilong: sprites.bossKuilong,
      };
      const bossSprite = bossSprites[boss.kind];
      const spriteSizes = {
        yubo: [206, 149],
        mirage: [224, 158],
        gale: [220, 166],
        volt: [218, 188],
        tide: [226, 178],
        ridge: [232, 184],
        chiji: [238, 238],
        kuilong: [244, 244],
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

      for (const part of boss.parts || []) {
        ctx.save();
        ctx.translate(part.xOffset, part.yOffset);
        if (part.destroyed) {
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = "#ff8b62";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-7, -7);
          ctx.lineTo(7, 7);
          ctx.moveTo(7, -7);
          ctx.lineTo(-7, 7);
          ctx.stroke();
        } else {
          const ratio = clamp(part.hp / part.maxHp, 0, 1);
          ctx.shadowBlur = part.flash > 0 ? 18 : 10;
          ctx.shadowColor = part.flash > 0 ? "#fff" : glow;
          ctx.fillStyle = part.flash > 0 ? "#fff" : "rgba(9, 28, 43, 0.92)";
          ctx.strokeStyle = glow;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, part.radius, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = glow;
          ctx.fillRect(-12, part.radius + 5, 24 * ratio, 3);
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.strokeRect(-12, part.radius + 5, 24, 3);
        }
        ctx.restore();
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
      } else if (boss.kind === "tide") {
        [-48, 0, 48].forEach((x, index) => {
          ctx.beginPath();
          ctx.arc(x, index === 1 ? -10 : 4, 10 + index * 2, boss.age, boss.age + Math.PI * 1.6);
          ctx.stroke();
        });
      } else if (boss.kind === "ridge") {
        ctx.beginPath();
        ctx.moveTo(-52, 9);
        ctx.lineTo(-25, -18);
        ctx.lineTo(0, 8);
        ctx.lineTo(25, -18);
        ctx.lineTo(52, 9);
        ctx.stroke();
      } else if (boss.kind === "chiji") {
        [-72, 72].forEach((x, index) => {
          ctx.beginPath();
          ctx.moveTo(x, 6);
          ctx.lineTo(x + Math.sin(boss.age * 8 + index) * 4, 37);
          ctx.lineTo(x, 56);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.lineTo(13, -9);
        ctx.lineTo(0, 28);
        ctx.lineTo(-13, -9);
        ctx.closePath();
        ctx.stroke();
      } else if (boss.kind === "kuilong") {
        ctx.beginPath();
        ctx.arc(0, 0, 18 + Math.sin(boss.age * 5) * 3, boss.age, boss.age + Math.PI * 1.7);
        ctx.stroke();
        [-72, 72].forEach((x, index) => {
          ctx.beginPath();
          ctx.moveTo(x, -33);
          ctx.lineTo(x + (index ? -8 : 8), -9);
          ctx.lineTo(x + (index ? 7 : -7), 13);
          ctx.lineTo(x, 38);
          ctx.stroke();
        });
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
    },

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
    },

    drawPickups() {
      const colors = {
        repair: "#68f0b0",
        energy: "#6ceaff",
        overdrive: "#ff9d5c",
        amplifier: "#ffc15c",
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
        } else if (pickup.type === "amplifier") {
          ctx.font = "900 8px Consolas, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("×2", 0, 0);
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
    },
  };
})();
