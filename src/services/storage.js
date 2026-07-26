(() => {
  "use strict";

  const FY = window.FY;
  const { STORAGE_KEY, FIGHTERS, LEVELS, clamp } = FY;
  const SAVE_SCHEMA_VERSION = 2;

  function loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        schemaVersion: SAVE_SCHEMA_VERSION,
        bestScore: Number.isFinite(data.bestScore) ? data.bestScore : 0,
        bestEndlessScore: Number.isFinite(data.bestEndlessScore) ? data.bestEndlessScore : 0,
        bestEndlessTime: Number.isFinite(data.bestEndlessTime) ? data.bestEndlessTime : 0,
        selectedFighter: FIGHTERS[data.selectedFighter] ? data.selectedFighter : "pulse",
        sound: data.sound !== false,
        showShieldValue: data.showShieldValue !== false,
        unlockedLevel: clamp(
          Math.floor(Number(data.unlockedLevel) || 1),
          1,
          Object.keys(LEVELS).length,
        ),
      };
    } catch {
      return {
        schemaVersion: SAVE_SCHEMA_VERSION,
        bestScore: 0,
        bestEndlessScore: 0,
        bestEndlessTime: 0,
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

  Object.assign(FY, { SAVE_SCHEMA_VERSION, loadSave, saveData });
})();
