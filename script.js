const palettes = {
  rose: {
    colors: ["#d9929d", "#f2c0ac", "#f4dfc6", "#ba6679", "#ddbaa6"],
    note: "rose quartz & warm light",
  },
  dusk: {
    colors: ["#7188a6", "#b6c3d4", "#718074", "#d8d0c2", "#52677e"],
    note: "blue lace & evening air",
  },
  moss: {
    colors: ["#87986e", "#c3bf89", "#d7a69b", "#5d765b", "#e6d5ad"],
    note: "moss agate & new leaves",
  },
};

const positions = [
  [12, 50], [19, 30], [34, 19], [52, 16], [70, 21], [84, 34], [90, 52], [79, 70], [61, 79], [40, 79], [23, 70], [10, 56],
];

const beads = document.querySelector("#beads");
const note = document.querySelector("#design-note");
let currentPalette = "rose";
let seed = 0;

function drawBracelet() {
  const { colors, note: paletteNote } = palettes[currentPalette];
  beads.innerHTML = "";
  positions.forEach(([x, y], index) => {
    const bead = document.createElement("span");
    bead.className = "bead";
    bead.style.setProperty("--x", `${x}%`);
    bead.style.setProperty("--y", `${y}%`);
    bead.style.background = colors[(index * 3 + seed) % colors.length];
    bead.title = "A bead in your Uzuki bracelet";
    beads.appendChild(bead);
  });
  note.textContent = `${positions.length} beads · ${paletteNote}`;
}

document.querySelectorAll(".palette-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentPalette = button.dataset.palette;
    document.querySelectorAll(".palette-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    drawBracelet();
  });
});

document.querySelector("#shuffle-button").addEventListener("click", () => {
  seed = (seed + 1) % palettes[currentPalette].colors.length;
  drawBracelet();
});

document.querySelector("#save-button").addEventListener("click", () => {
  const design = { palette: currentPalette, seed, savedAt: new Date().toISOString() };
  localStorage.setItem("uzuki-bracelet", JSON.stringify(design));
  note.textContent = "saved in this browser · bring it to a workshop";
});

const saved = localStorage.getItem("uzuki-bracelet");
if (saved) {
  try {
    const design = JSON.parse(saved);
    if (palettes[design.palette]) {
      currentPalette = design.palette;
      seed = design.seed || 0;
      document.querySelectorAll(".palette-button").forEach((button) => {
        const active = button.dataset.palette === currentPalette;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
  } catch { /* Ignore an invalid local design. */ }
}

drawBracelet();

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
