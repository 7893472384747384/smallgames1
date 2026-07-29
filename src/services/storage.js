(() => {
  "use strict";

  const FY = window.FY;
  const { STORAGE_KEY, FIGHTERS, LEVELS, GROWTH, clamp } = FY;
  const SAVE_SCHEMA_VERSION = 4;
  const RANKS = new Set(["C", "B", "A", "S"]);

  function getEarnedGrowthPoints(bestRanks = {}) {
    return Object.entries(bestRanks).filter(
      ([level, rank]) => LEVELS[Number(level)] && RANKS.has(rank),
    ).length;
  }

  function createEmptyGrowth() {
    return Object.fromEntries(Object.keys(GROWTH.attributes).map((id) => [id, 0]));
  }

  function normalizeGrowth(rawGrowth, earnedPoints) {
    const growth = createEmptyGrowth();
    if (rawGrowth && typeof rawGrowth === "object") {
      for (const id of Object.keys(growth)) {
        growth[id] = clamp(
          Math.floor(Number(rawGrowth[id]) || 0),
          0,
          GROWTH.maxRank,
        );
      }
    }
    let overflow =
      Object.values(growth).reduce((total, rank) => total + rank, 0) -
      Math.max(0, Math.floor(Number(earnedPoints) || 0));
    for (const id of Object.keys(growth).reverse()) {
      if (overflow <= 0) break;
      const removed = Math.min(growth[id], overflow);
      growth[id] -= removed;
      overflow -= removed;
    }
    return growth;
  }

  function loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const bestRanks =
        data.bestRanks && typeof data.bestRanks === "object" ? { ...data.bestRanks } : {};
      let unlockedLevel = clamp(
        Math.floor(Number(data.unlockedLevel) || 1),
        1,
        Object.keys(LEVELS).length,
      );
      for (const completedLevel of Object.keys(bestRanks).map(Number)) {
        if (LEVELS[completedLevel + 1]) {
          unlockedLevel = Math.max(unlockedLevel, completedLevel + 1);
        }
      }
      const growth = normalizeGrowth(
        data.growth,
        getEarnedGrowthPoints(bestRanks),
      );
      return {
        schemaVersion: SAVE_SCHEMA_VERSION,
        bestScore: Number.isFinite(data.bestScore) ? data.bestScore : 0,
        bestEndlessScore: Number.isFinite(data.bestEndlessScore) ? data.bestEndlessScore : 0,
        bestEndlessTime: Number.isFinite(data.bestEndlessTime) ? data.bestEndlessTime : 0,
        bestRanks,
        growth,
        selectedFighter: FIGHTERS[data.selectedFighter] ? data.selectedFighter : "pulse",
        sound: data.sound !== false,
        showShieldValue: data.showShieldValue !== false,
        unlockedLevel,
      };
    } catch {
      return {
        schemaVersion: SAVE_SCHEMA_VERSION,
        bestScore: 0,
        bestEndlessScore: 0,
        bestEndlessTime: 0,
        bestRanks: {},
        growth: createEmptyGrowth(),
        selectedFighter: "pulse",
        sound: true,
        showShieldValue: true,
        unlockedLevel: 1,
      };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, schemaVersion: SAVE_SCHEMA_VERSION }),
      );
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  Object.assign(FY, {
    SAVE_SCHEMA_VERSION,
    createEmptyGrowth,
    getEarnedGrowthPoints,
    normalizeGrowth,
    loadSave,
    saveData,
  });
})();
