# Uzuki

The website for **Uzuki** — handmade flowers, tiny rituals and creative workshops.

## First release

- Brand-led landing page for flowers, handmade objects and workshops
- A standalone crystal bracelet studio (`make.html`): templates, bead editing, undo/redo, estimated sizing, browser-local saving, and PNG design cards
- A homepage bouquet maker prototype
- Etsy links for purchases (replace the placeholder Etsy links with the shop URL)
- GitHub Pages deployment through GitHub Actions

## Publish on GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`. The deployment workflow will publish the site at
   `https://qingyu9243.github.io/uzuki/`.

No secrets are required for this static first version. Future AI functionality
must run through a separate server-side endpoint so its API key never reaches
the browser.

## Local preview

Run `python3 -m http.server 8000` from this directory, then open
`http://localhost:8000/make.html?type=bracelet`.

The bracelet studio is buildless and uses illustrative material choices. Drafts are
saved on demand in localStorage on the current browser and origin. Exported PNG
cards include the design and material quantities. Inner circumference is estimated
from a ring of tangent beads, subtracting the largest bead radius; actual fit and
workshop material availability must be checked in person.

## Sample bead catalog

`data/beads.js` holds sample material metadata, source-image rectangles, and
styling prompts. The studio includes 14 image-based samples across seven color
families, plus the four original illustrations needed for saved V1 designs.
Image samples have simulated 6/8/10 mm variants; filters select color, size and
category. The ⓘ dialog shows the reference, styling inspiration and unconfirmed
origin/price fields. PNG export uses the same image crops and grows to accommodate
the full material list. See `assets/beads/README.md` for provenance and replacement.

## Direct bead editing

Drag a material onto the bracelet to insert it at the highlighted position. Drag
an existing bead along the ring to reorder it. Drop it outside the ring or into
the central hole to remove it; the ring previews the removal before release.
Tray drops outside the canvas, Escape, pointer cancellation and loss of window
focus leave the design unchanged. Each completed drag is one undo step.
On touch screens, drag material beads by their image; the rest of the card/tray
remains scrollable. Dragging near the viewport edge scrolls the page. Clicking
still adds/selects/replaces beads. Focused bracelet beads also support Left/Right,
Delete/Backspace and Escape. Drag edits do not require the Done button.

## Mobile workbench

At widths up to 800 px, the studio fits the dynamic viewport: the bracelet stays
above an independently scrollable bead tray. Color/size controls stay visible,
and tapping a material adds or replaces a bead with a brief arrival animation
(respecting reduced-motion preferences). The bottom “Size, list & save” button
opens a native modal sheet with the existing design controls. The same controls
move back to the desktop sidebar at larger widths; inputs are not duplicated.
