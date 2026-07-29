(() => {
  "use strict";

  const FY = window.FY;
  const { WIDTH, HEIGHT, TAU, STORAGE_KEY, ENVIRONMENTS, LEVELS, ENDLESS_ENVIRONMENTS, ENDLESS_BOSSES, FIGHTERS, canvas, ctx, sprites, ui, clamp, lerp, random, distanceSquared, formatScore, formatTime, saveData } = FY;

  FY.mixins.backgrounds = {
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
        oceanFront: ["#031b2c", "#07536a", "#042a42", "#b8f7ff"],
        riverValley: ["#071c18", "#245348", "#10291f", "#e1ffd2"],
        volcanicCaldera: ["#1d0908", "#592018", "#260b0a", "#ffd0a0"],
        prismCitadel: ["#090b24", "#263466", "#10122d", "#e9e5ff"],
      };
      const palette = palettes[this.environment];
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      const storming =
        this.weather?.type === "storm" ||
        this.weather?.type === "boss" ||
        this.weather?.type === "thunder" ||
        this.weather?.type === "chijiBoss" ||
        this.weather?.type === "kuilongBoss";
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
      else if (this.environment === "oceanFront") this.drawOceanFront();
      else if (this.environment === "riverValley") this.drawRiverValley();
      else if (this.environment === "volcanicCaldera") this.drawVolcanicCaldera();
      else if (this.environment === "prismCitadel") this.drawPrismCitadel();
      else this.drawOrbitalRuins();
      const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 170, WIDTH / 2, HEIGHT / 2, 490);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,3,9,0.64)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    },

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
    },

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
    },

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
    },

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
    },

    drawThunderCanyon() {
      const scroll = (this.ambientTime * 25) % 260;
      ctx.save();
      const corePulse = 0.13 + Math.sin(this.ambientTime * 2.4) * 0.035;
      const core = ctx.createRadialGradient(WIDTH / 2, 175, 4, WIDTH / 2, 175, 150);
      core.addColorStop(0, `rgba(213, 170, 255, ${corePulse + 0.09})`);
      core.addColorStop(0.35, `rgba(112, 82, 220, ${corePulse})`);
      core.addColorStop(1, "rgba(80, 41, 150, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, WIDTH, 360);
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
      ctx.globalCompositeOperation = "lighter";
      for (const side of [-1, 1]) {
        const x = side < 0 ? 58 : WIDTH - 58;
        ctx.strokeStyle = "rgba(191, 147, 255, 0.42)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, HEIGHT + 30);
        ctx.lineTo(x + side * 9, HEIGHT - 150);
        ctx.lineTo(x - side * 6, HEIGHT - 255);
        ctx.lineTo(x, HEIGHT - 345);
        ctx.stroke();
        for (let node = 0; node < 4; node += 1) {
          const y = HEIGHT - 95 - node * 150 + scroll * 0.35;
          ctx.fillStyle = "rgba(118, 80, 192, 0.68)";
          ctx.strokeStyle = "rgba(218, 188, 255, 0.55)";
          ctx.beginPath();
          ctx.moveTo(x, y - 23);
          ctx.lineTo(x + 11, y + 7);
          ctx.lineTo(x, y + 21);
          ctx.lineTo(x - 11, y + 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawSandstormRuins() {
      const scroll = (this.ambientTime * 20) % 230;
      ctx.save();
      const sun = ctx.createRadialGradient(WIDTH - 78, 112, 5, WIDTH - 78, 112, 88);
      sun.addColorStop(0, "rgba(255, 236, 171, 0.48)");
      sun.addColorStop(0.32, "rgba(255, 154, 76, 0.18)");
      sun.addColorStop(1, "rgba(255, 125, 54, 0)");
      ctx.fillStyle = sun;
      ctx.fillRect(WIDTH - 180, 10, 180, 210);
      ctx.fillStyle = "rgba(255, 207, 132, 0.16)";
      ctx.beginPath();
      ctx.arc(WIDTH - 78, 112, 34, 0, TAU);
      ctx.fill();
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
      ctx.fillStyle = "rgba(83, 39, 23, 0.38)";
      for (let layer = 0; layer < 3; layer += 1) {
        const baseY = HEIGHT - 90 + layer * 45;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= WIDTH; x += 45) {
          const y =
            baseY -
            18 -
            Math.sin(x * 0.018 + this.ambientTime * (0.22 + layer * 0.08) + layer) *
              (22 + layer * 5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(WIDTH, HEIGHT);
        ctx.lineTo(0, HEIGHT);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },

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
    },

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
    },

    drawOceanFront() {
      const scroll = (this.ambientTime * 34) % 180;
      ctx.save();
      const sea = ctx.createLinearGradient(0, 0, WIDTH, 0);
      sea.addColorStop(0, "rgba(2, 18, 31, 0.62)");
      sea.addColorStop(0.5, "rgba(13, 105, 128, 0.2)");
      sea.addColorStop(1, "rgba(2, 18, 31, 0.62)");
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = "rgba(135, 244, 255, 0.25)";
      ctx.lineWidth = 1.2;
      for (let row = -1; row < 7; row += 1) {
        const y = row * 180 + scroll;
        ctx.beginPath();
        for (let x = -20; x <= WIDTH + 20; x += 16) {
          const waveY = y + Math.sin(x * 0.048 + row + this.ambientTime * 1.4) * 8;
          if (x === -20) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      for (let row = -1; row < 5; row += 1) {
        const y = row * 235 + ((this.ambientTime * 27) % 235);
        for (const side of [-1, 1]) {
          const x = side < 0 ? 32 + (row % 2) * 18 : WIDTH - 38 - (row % 2) * 16;
          ctx.fillStyle = "rgba(18, 54, 48, 0.78)";
          ctx.strokeStyle = "rgba(92, 211, 177, 0.3)";
          ctx.beginPath();
          ctx.ellipse(x, y, 42, 22, side * 0.28, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(88, 135, 73, 0.34)";
          ctx.beginPath();
          ctx.ellipse(x - side * 5, y - 3, 23, 10, 0, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    },

    drawRiverValley() {
      const scroll = (this.ambientTime * 31) % 260;
      ctx.save();
      ctx.fillStyle = "rgba(12, 35, 24, 0.74)";
      ctx.strokeStyle = "rgba(139, 196, 112, 0.24)";
      for (let row = -1; row < 5; row += 1) {
        const y = row * 260 + scroll;
        ctx.beginPath();
        ctx.moveTo(0, y - 120);
        ctx.lineTo(82, y - 72);
        ctx.lineTo(42, y - 8);
        ctx.lineTo(108, y + 82);
        ctx.lineTo(0, y + 148);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(WIDTH, y - 105);
        ctx.lineTo(WIDTH - 76, y - 55);
        ctx.lineTo(WIDTH - 38, y + 10);
        ctx.lineTo(WIDTH - 102, y + 94);
        ctx.lineTo(WIDTH, y + 154);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(104, 224, 224, 0.28)";
      ctx.lineWidth = 62;
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2 + Math.sin(this.ambientTime * 0.7) * 46, -30);
      ctx.bezierCurveTo(
        110,
        210,
        350,
        420,
        WIDTH / 2 + Math.sin(this.ambientTime * 0.7 + 2) * 62,
        HEIGHT + 40,
      );
      ctx.stroke();
      ctx.strokeStyle = "rgba(195, 255, 231, 0.24)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i += 1) {
        const y = (i * 91 + this.ambientTime * 55) % HEIGHT;
        const center = WIDTH / 2 + Math.sin(y * 0.012 + this.ambientTime * 0.7) * 58;
        ctx.beginPath();
        ctx.moveTo(center - 21, y);
        ctx.lineTo(center + 21, y + 5);
        ctx.stroke();
      }
      ctx.restore();
    },

    drawVolcanicCaldera() {
      const scroll = (this.ambientTime * 30) % 230;
      ctx.save();
      ctx.fillStyle = "rgba(47, 14, 13, 0.76)";
      ctx.strokeStyle = "rgba(255, 111, 62, 0.25)";
      for (let row = -1; row < 5; row += 1) {
        const y = row * 230 + scroll;
        for (const side of [-1, 1]) {
          const edge = side < 0 ? 0 : WIDTH;
          ctx.beginPath();
          ctx.moveTo(edge, y - 120);
          ctx.lineTo(edge - side * 78, y - 70);
          ctx.lineTo(edge - side * 42, y - 5);
          ctx.lineTo(edge - side * 105, y + 75);
          ctx.lineTo(edge, y + 145);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 98, 45, 0.38)";
      ctx.lineWidth = 5;
      for (let seam = 0; seam < 4; seam += 1) {
        const baseX = 65 + seam * 108;
        ctx.beginPath();
        ctx.moveTo(baseX, -30);
        for (let y = -30; y <= HEIGHT + 40; y += 58) {
          ctx.lineTo(baseX + Math.sin(y * 0.025 + seam * 1.7) * 24, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255, 155, 64, 0.42)";
      for (let i = 0; i < 22; i += 1) {
        const x = (i * 83 + this.ambientTime * (18 + (i % 4) * 7)) % (WIDTH + 40) - 20;
        const y = (i * 47 + this.ambientTime * 92) % HEIGHT;
        ctx.fillRect(x, y, 2 + (i % 3), 5 + (i % 5));
      }
      ctx.restore();
    },

    drawPrismCitadel() {
      const scroll = (this.ambientTime * 38) % 210;
      ctx.save();
      for (let row = -1; row < 6; row += 1) {
        const y = row * 210 + scroll;
        for (let column = 0; column < 5; column += 1) {
          const x = 38 + column * 96 + ((row + column) % 2) * 17;
          const height = 46 + ((row * 19 + column * 23) % 70);
          const tower = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
          tower.addColorStop(0, "rgba(72, 88, 166, 0.16)");
          tower.addColorStop(0.5, "rgba(191, 229, 255, 0.2)");
          tower.addColorStop(1, "rgba(199, 103, 245, 0.14)");
          ctx.fillStyle = tower;
          ctx.strokeStyle = "rgba(180, 221, 255, 0.28)";
          ctx.beginPath();
          ctx.moveTo(x, y - height - 24);
          ctx.lineTo(x + 23, y - height);
          ctx.lineTo(x + 17, y);
          ctx.lineTo(x - 17, y);
          ctx.lineTo(x - 23, y - height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1.4;
      for (let ray = 0; ray < 7; ray += 1) {
        const hue = ray % 2 ? "rgba(255,128,235,0.16)" : "rgba(103,235,255,0.17)";
        ctx.strokeStyle = hue;
        const x = (ray * 79 + this.ambientTime * 42) % (WIDTH + 150) - 75;
        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.lineTo(x + 130, HEIGHT + 20);
        ctx.stroke();
      }
      ctx.restore();
    },

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
    },
  };
})();
