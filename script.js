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
let stemCount = 9;
let ribbon = 'lavender';
const ribbonColors = { lavender:'#a58fa7', cream:'#d8c8a8', rose:'#ba8993' };
function updateExtras() {
  document.querySelectorAll('.size-choice').forEach(button => {
    const active=Number(button.dataset.size)===stemCount;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('.ribbon-choice').forEach(button => {
    const active=button.dataset.ribbon===ribbon;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  document.querySelector('.bouquet-ribbon').style.background=ribbonColors[ribbon];
}
document.querySelectorAll('.size-choice').forEach(button=>button.addEventListener('click',()=>{stemCount=Number(button.dataset.size);updateExtras();drawBouquet();}));
document.querySelectorAll('.ribbon-choice').forEach(button=>button.addEventListener('click',()=>{ribbon=button.dataset.ribbon;updateExtras();note.textContent=bouquetNote();}));

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
  return `${stemCount} stems · ${flowers.join(" & ")}`;
}

function drawBouquet() {
  bouquet.innerHTML = "";
  document.querySelector('#save-button').disabled=!selectedFlowers.length;
  document.querySelector('#shuffle-button').disabled=!selectedFlowers.length;
  bouquet.setAttribute('aria-label',bouquetNote());
  if (!selectedFlowers.length) {
    note.textContent = bouquetNote();
    return;
  }

  const arrangement = Array.from({length:stemCount},(_,i)=>{
    const spread=stemCount===5?36:stemCount===9?52:60;
    const position=stemCount===1?0:i/(stemCount-1)-.5;
    return [50+position*spread,180+Math.sin(i*2.4+seed*1.7)*22+(i%3)*12,position*48+Math.sin(i+seed)*5];
  });

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
  seed = (seed + 1) % 1000;
  drawBouquet();
});

document.querySelector("#save-button").addEventListener("click", () => {
  const design = { flowers: selectedFlowers, wrap: currentWrap, seed, stemCount, ribbon, savedAt: new Date().toISOString() };
  try { localStorage.setItem("uzuki-bouquet", JSON.stringify(design)); }
  catch { note.textContent='Could not save in this browser. Please allow browser storage and try again.';return; }
  note.textContent = "saved in this browser · ready to bring to the flower bar";
});

let saved;
try { saved = localStorage.getItem("uzuki-bouquet"); } catch { /* The builder works without storage. */ }
if (saved) {
  try {
    const design = JSON.parse(saved);
    if (Array.isArray(design.flowers) && design.flowers.every((flower) => flowerNames[flower])) {
      selectedFlowers = design.flowers;
    }
    if (["petal", "linen", "sage"].includes(design.wrap)) currentWrap = design.wrap;
    if (Number.isInteger(design.seed) && design.seed >= 0) seed = design.seed % 1000;
    if ([5,9,13].includes(design.stemCount)) stemCount=design.stemCount;
    if (Object.hasOwn(ribbonColors,design.ribbon)) ribbon=design.ribbon;
  } catch { /* Ignore an invalid saved bouquet. */ }
}

updateExtras();
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

const makeDropdown = document.querySelector('.make-dropdown');
function closeMakeDropdown() { makeDropdown.open = false; }
document.addEventListener('click', (event) => {
  if (!makeDropdown.contains(event.target)) closeMakeDropdown();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && makeDropdown.open) {
    closeMakeDropdown();
    makeDropdown.querySelector('summary').focus();
  }
});
makeDropdown.addEventListener('focusout', (event) => {
  if (!makeDropdown.contains(event.relatedTarget)) closeMakeDropdown();
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMakeDropdown));
