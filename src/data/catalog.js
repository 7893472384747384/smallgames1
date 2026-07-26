(() => {
  "use strict";

  const FY = window.FY;
  const ENVIRONMENTS = [
    "skyCity",
    "cloudSea",
    "windCorridor",
    "powerGrid",
    "thunderCanyon",
    "sandstorm",
    "polarNight",
    "orbitalRuins",
    "oceanFront",
    "riverValley",
  ];

  const LEVELS = {
    1: {
      code: "F-01",
      kicker: "第一章 · 01",
      title: "晴空防线",
      environment: "skyCity",
      mission: "天候核心出现异常，积雨云母舰正逼近浮空城。穿越雷区，在风暴成形前将其击落。",
      clearTitle: "风暴已平息",
    },
    2: {
      code: "F-02",
      kicker: "第一章 · 02",
      title: "云海追猎",
      environment: "cloudSea",
      mission: "敌方巡猎舰潜入云海。利用云隙识别伏击编队，摆脱锁定并击破隐云母舰“蜃影”。",
      clearTitle: "云幕已突破",
    },
    3: {
      code: "F-03",
      kicker: "第一章 · 03",
      title: "风塔回廊",
      environment: "windCorridor",
      mission: "风塔群被敌军接管，航道正在周期性收束。观察两侧风压预警，穿过安全回廊并摧毁风塔守卫。",
      clearTitle: "回廊已贯通",
    },
    4: {
      code: "F-04",
      kicker: "第一章 · 04",
      title: "电网边境",
      environment: "powerGrid",
      mission: "边境电网失控，纵横电弧会同时伤害敌我。诱导敌机进入导电区，击破控制电网的裁决舰。",
      clearTitle: "电网已解放",
    },
    5: {
      code: "F-05",
      kicker: "第二章 · 01",
      title: "怒海孤航",
      environment: "oceanFront",
      mission: "远海潮汐航道被深海母舰封锁。穿过岛链与涌浪，在巨浪合围前击沉潮汐核心“玄鲸”。",
      clearTitle: "玄潮已平息",
    },
    6: {
      code: "F-06",
      kicker: "第二章 · 02",
      title: "山河险渡",
      environment: "riverValley",
      mission: "敌方山河要塞沿峡谷逆流而上。躲避落石标记，沿河谷推进并摧毁风岩核心“岚蛟”。",
      clearTitle: "山河航道已贯通",
    },
  };

  const ENDLESS_ENVIRONMENTS = [
    "skyCity",
    "cloudSea",
    "windCorridor",
    "powerGrid",
    "thunderCanyon",
    "sandstorm",
    "polarNight",
    "orbitalRuins",
    "oceanFront",
    "riverValley",
  ];

  const ENDLESS_BOSSES = ["yubo", "mirage", "gale", "volt", "tide", "ridge"];

  const FIGHTERS = {
    pulse: {
      name: "苍隼",
      weapon: "双联脉冲光弹",
      sprite: "player",
      image: "assets/ships/player-interceptor-game.png",
      tagline: "双联脉冲 · 灵活稳定",
      cardClass: "",
    },
    laser: {
      name: "曜光",
      weapon: "持续聚束激光",
      sprite: "playerLaser",
      image: "assets/ships/player-laser-game.png",
      tagline: "聚束激光 · 过热冷却",
      cardClass: "",
    },
    dual: {
      name: "赤霄",
      weapon: "高频双短束激光",
      sprite: "playerDual",
      image: "assets/ships/player-red-dual-game.png",
      tagline: "双短束激光 · 高频点射",
      cardClass: "fighter-card-red",
    },
    bomber: {
      name: "紫宸",
      weapon: "自动区域轰炸",
      sprite: "playerBomber",
      image: "assets/ships/player-bomber-purple-game.png",
      tagline: "区域轰炸 · 自动寻敌",
      cardClass: "fighter-card-purple",
    },
  };

  Object.assign(FY, {
    ENVIRONMENTS,
    LEVELS,
    ENDLESS_ENVIRONMENTS,
    ENDLESS_BOSSES,
    FIGHTERS,
  });
})();
