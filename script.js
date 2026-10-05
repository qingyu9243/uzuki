const flowerNames = {
  cosmos: "cosmos",
  daisy: "daisies",
  sweetpea: "sweet peas",
};

const bouquet = document.querySelector("#bouquet");
const bouquetWrap = document.querySelector("#bouquet-wrap");
const note = document.querySelector("#design-note");
let selectedFlowers = ["cosmos", "daisy"];
let currentWrap = "petal";
let seed = 0;

function updateFlowerChoices() {
  document.querySelectorAll(".flower-choice").forEach((button) => {
    const active = selectedFlowers.includes(button.dataset.flower);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function updateWrapChoices() {
  document.querySelectorAll(".wrap-choice").forEach((button) => {
    const active = button.dataset.wrap === currentWrap;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  bouquetWrap.className = `bouquet-wrap ${currentWrap}`;
}

function bouquetNote() {
  const flowers = selectedFlowers.map((flower) => flowerNames[flower]);
  if (!flowers.length) return "Pick at least one bloom to begin";
  return `A soft posy of ${flowers.join(" & ")}`;
}

function drawBouquet() {
  bouquet.innerHTML = "";
  if (!selectedFlowers.length) {
    note.textContent = bouquetNote();
    return;
  }

  const arrangement = [
    [14, 177, -28], [28, 214, -17], [42, 191, -7], [50, 230, 0],
    [59, 198, 8], [71, 217, 17], [85, 181, 28], [36, 235, -12], [65, 238, 12],
  ];

  arrangement.forEach(([x, stemHeight, tilt], index) => {
    const flower = selectedFlowers[(index + seed) % selectedFlowers.length];
    const stem = document.createElement("div");
    stem.className = `bouquet-stem ${flower}`;
    stem.style.left = `${x}%`;
    stem.style.setProperty("--stem-height", `${stemHeight}px`);
    stem.style.setProperty("--tilt", `${tilt}deg`);

    const bloom = document.createElement("div");
    bloom.className = "bouquet-bloom";
    for (let petal = 0; petal < 5; petal += 1) bloom.appendChild(document.createElement("span"));
    stem.appendChild(bloom);
    bouquet.appendChild(stem);
  });
  note.textContent = bouquetNote();
}

document.querySelectorAll(".flower-choice").forEach((button) => {
  button.addEventListener("click", () => {
    const flower = button.dataset.flower;
    if (selectedFlowers.includes(flower)) {
      selectedFlowers = selectedFlowers.filter((item) => item !== flower);
    } else {
      selectedFlowers = [...selectedFlowers, flower];
    }
    updateFlowerChoices();
    drawBouquet();
  });
});

document.querySelectorAll(".wrap-choice").forEach((button) => {
  button.addEventListener("click", () => {
    currentWrap = button.dataset.wrap;
    updateWrapChoices();
  });
});

document.querySelector("#shuffle-button").addEventListener("click", () => {
  seed = (seed + 1) % Math.max(selectedFlowers.length, 1);
  drawBouquet();
});

document.querySelector("#save-button").addEventListener("click", () => {
  const design = { flowers: selectedFlowers, wrap: currentWrap, seed, savedAt: new Date().toISOString() };
  localStorage.setItem("uzuki-bouquet", JSON.stringify(design));
  note.textContent = "saved in this browser · ready to bring to the flower bar";
});

const saved = localStorage.getItem("uzuki-bouquet");
if (saved) {
  try {
    const design = JSON.parse(saved);
    if (Array.isArray(design.flowers) && design.flowers.every((flower) => flowerNames[flower])) {
      selectedFlowers = design.flowers;
    }
    if (["petal", "linen", "sage"].includes(design.wrap)) currentWrap = design.wrap;
    if (Number.isInteger(design.seed)) seed = design.seed;
  } catch { /* Ignore an invalid saved bouquet. */ }
}

updateFlowerChoices();
updateWrapChoices();
drawBouquet();

document.querySelector("#year").textContent = new Date().getFullYear();
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));
