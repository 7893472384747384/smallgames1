(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, BALANCE, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.hud = {
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
          this.player.burstTimer > 0 || this.player.overdriveTimer > 0
            ? BALANCE.dual.boostedInterval
            : BALANCE.dual.interval;
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
          tide: "潮汐母舰 · 玄鲸",
          ridge: "山河要塞 · 岚蛟",
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
      const amplifierReady = this.player.amplifierCharges > 0 && this.state === "playing";
      const amplifierActive = this.player.amplifierTimer > 0;
      ui.amplifierButton.classList.toggle("ready", amplifierReady);
      ui.amplifierButton.classList.toggle("active", amplifierActive);
      ui.amplifierButton.disabled = !amplifierReady;
      ui.amplifierCount.textContent = String(this.player.amplifierCharges);
      ui.amplifierButton.setAttribute(
        "aria-label",
        amplifierActive
          ? `双倍火力剩余 ${this.player.amplifierTimer.toFixed(1)} 秒，库存 ${this.player.amplifierCharges} 个`
          : `释放倍增核心，库存 ${this.player.amplifierCharges} 个`,
      );
    },

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
    },

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
    },

    drawBar(x, y, width, height, ratio, color) {
      ctx.fillStyle = "rgba(113, 160, 176, 0.16)";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width * clamp(ratio, 0, 1), height);
    },

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
    },
  };
})();
