(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.effects = {
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
    },

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
    },

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
    },

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
    },

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
    },

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
    },
  };
})();
