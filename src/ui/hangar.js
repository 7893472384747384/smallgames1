(() => {
  "use strict";

  const FY = window.FY;
  const { FIGHTERS, LEVELS, GROWTH, ui } = FY;
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

  for (const [attributeId, attribute] of Object.entries(GROWTH.attributes)) {
    const row = document.createElement("div");
    row.className = "growth-row";

    const copy = document.createElement("span");
    const name = document.createElement("strong");
    const description = document.createElement("small");
    name.textContent = attribute.name;
    description.textContent = `${attribute.description} · 每级 ${attribute.display}`;
    copy.append(name, description);

    const rank = document.createElement("b");
    rank.className = "growth-rank";
    rank.textContent = `0/${GROWTH.maxRank}`;

    const button = document.createElement("button");
    button.className = "growth-add-button";
    button.type = "button";
    button.textContent = "+";
    button.setAttribute("aria-label", `提升${attribute.name}`);

    row.append(copy, rank, button);
    ui.growthList.append(row);
    ui.growthButtons[attributeId] = button;
    ui.growthRanks[attributeId] = rank;
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
