(() => {
  "use strict";

  const FY = window.FY;
  const { FIGHTERS, ui } = FY;

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
})();
