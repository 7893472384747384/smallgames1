(() => {
  "use strict";

  const FY = window.FY;
  const { FIGHTERS, LEVELS, ui } = FY;
  const numerals = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

  for (const [fighterId, fighter] of Object.entries(FIGHTERS)) {
    const button = document.createElement("button");
    button.id = `fighter-${fighterId}`;
    button.className = ["fighter-card", fighter.cardClass].filter(Boolean).join(" ");
    button.type = "button";
    button.setAttribute("aria-pressed", "false");

    const image = document.createElement("img");
    image.src = fighter.image;
    image.alt = "";

    const copy = document.createElement("span");
    const name = document.createElement("strong");
    const tagline = document.createElement("small");
    name.textContent = fighter.name;
    tagline.textContent = fighter.tagline;
    copy.append(name, tagline);
    button.append(image, copy);
    ui.fighterSelector.append(button);
    ui.fighterButtons[fighterId] = button;
  }

  for (const level of Object.keys(LEVELS).map(Number).filter((value) => value > 1)) {
    const button = document.createElement("button");
    button.id = `level-${level}`;
    button.className = "secondary-button";
    button.type = "button";
    button.hidden = true;
    button.textContent = `第${numerals[level] || level}关`;
    ui.levelShortcuts.append(button);
    ui.levelButtons[level] = button;
  }
})();
