(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.bosses = {
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
            tide: "击破玄鲸的深海潮汐反应炉",
            ridge: "摧毁岚蛟的山河风岩核心",
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
      if (boss.kind === "tide") {
        this.updateTideBoss(dt);
        return;
      }
      if (boss.kind === "ridge") {
        this.updateRidgeBoss(dt);
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
    },

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
    },

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
    },

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
    },

    updateTideBoss(dt) {
      const boss = this.boss;
      if (!boss) return;
      const ratio = boss.hp / boss.maxHp;
      const nextPhase = ratio > 0.68 ? 1 : ratio > 0.34 ? 2 : 3;
      if (nextPhase !== boss.phase) {
        boss.phase = nextPhase;
        boss.fireTimer = 0.25;
        boss.summonTimer = 2.1;
        this.screenFlash = 0.25;
        this.shake = 8;
        this.showBanner(
          nextPhase === 2 ? "双翼潮门展开" : "深海反应炉临界",
          `玄鲸进入第 ${nextPhase} 潮汐形态`,
          2.2,
        );
      }
      boss.x = WIDTH / 2 + Math.sin(boss.age * (boss.phase === 3 ? 1.12 : 0.68)) * 132;
      boss.y = 142 + Math.sin(boss.age * 1.5) * 14;
      boss.fireTimer -= dt;
      boss.summonTimer -= dt;

      if (boss.fireTimer <= 0) {
        if (boss.phase === 1) {
          this.fireFan(boss.x - 54, boss.y + 26, 5, 0.14, 150, "#72f2ff");
          this.fireFan(boss.x + 54, boss.y + 26, 5, 0.14, 150, "#4faeff");
          boss.fireTimer = 1;
        } else if (boss.phase === 2) {
          this.fireRadial(boss.x, boss.y, 18, 120, "#65eaff", boss.patternStep * 0.16);
          if (boss.patternStep % 2 === 0) this.createTideSurge();
          boss.patternStep += 1;
          boss.fireTimer = 0.76;
        } else {
          this.fireSpiral(boss.x - 45, boss.y + 16, boss.patternStep, "#7efcff");
          this.fireSpiral(boss.x + 45, boss.y + 16, -boss.patternStep, "#778cff");
          if (boss.patternStep % 4 === 0) this.createTideSurge();
          boss.patternStep += 1;
          boss.fireTimer = 0.34;
        }
      }

      if (boss.summonTimer <= 0) {
        if (boss.phase === 1) {
          this.spawnEnemy("scout", clamp(boss.x - 76, 40, WIDTH - 40), boss.y + 20, {
            phase: boss.age,
          });
          this.spawnEnemy("scout", clamp(boss.x + 76, 40, WIDTH - 40), boss.y + 20, {
            phase: boss.age + 1,
          });
        } else if (boss.phase === 2) {
          this.spawnEnemy("sweeper", clamp(boss.x, 55, WIDTH - 55), boss.y + 18, {
            phase: boss.age,
            hpScale: 0.95,
          });
        } else {
          this.createTideSurge();
        }
        boss.summonTimer = boss.phase === 3 ? 3 : 4.7;
      }
      if (boss.hp <= 0) this.destroyBoss();
    },

    updateRidgeBoss(dt) {
      const boss = this.boss;
      if (!boss) return;
      const ratio = boss.hp / boss.maxHp;
      const nextPhase = ratio > 0.7 ? 1 : ratio > 0.35 ? 2 : 3;
      if (nextPhase !== boss.phase) {
        boss.phase = nextPhase;
        boss.fireTimer = 0.24;
        boss.summonTimer = 2;
        this.screenFlash = 0.26;
        this.shake = 9;
        this.showBanner(
          nextPhase === 2 ? "山翼岩甲展开" : "风岩核心超载",
          `岚蛟进入第 ${nextPhase} 山河形态`,
          2.2,
        );
      }
      boss.x = WIDTH / 2 + Math.sin(boss.age * (boss.phase === 3 ? 1.25 : 0.74)) * 122;
      boss.y = 143 + Math.sin(boss.age * 1.7) * 12;
      boss.fireTimer -= dt;
      boss.summonTimer -= dt;

      if (boss.fireTimer <= 0) {
        if (boss.phase === 1) {
          this.fireFan(boss.x, boss.y + 38, 9, 0.12, 154, "#b6e86c");
          boss.fireTimer = 0.98;
        } else if (boss.phase === 2) {
          this.fireRadial(boss.x, boss.y, 20, 124, "#8fda72", boss.patternStep * 0.14);
          if (boss.patternStep % 2 === 0) this.createRockfall();
          boss.patternStep += 1;
          boss.fireTimer = 0.74;
        } else {
          this.fireSpiral(boss.x, boss.y + 18, boss.patternStep, "#d8b069");
          this.fireFan(boss.x, boss.y + 34, 7, 0.1, 184, "#95e393");
          if (boss.patternStep % 3 === 0) this.createRockfall();
          boss.patternStep += 1;
          boss.fireTimer = 0.4;
        }
      }

      if (boss.summonTimer <= 0) {
        if (boss.phase === 1) {
          this.spawnEnemy("charger", clamp(this.player.x + random(-95, 95), 45, WIDTH - 45), -45, {
            phase: boss.age,
            hpScale: 0.95,
          });
        } else if (boss.phase === 2) {
          this.spawnEnemy("sweeper", clamp(boss.x, 55, WIDTH - 55), boss.y + 20, {
            phase: boss.age,
            hpScale: 1,
          });
        } else {
          this.createRockfall();
          this.createRockfall(random(55, WIDTH - 55), random(190, HEIGHT - 135));
        }
        boss.summonTimer = boss.phase === 3 ? 2.9 : 4.6;
      }
      if (boss.hp <= 0) this.destroyBoss();
    },
  };
})();
