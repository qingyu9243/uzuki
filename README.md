# Uzuki

The website for **Uzuki** — handmade flowers, tiny rituals and creative workshops.

## First release

- Brand-led landing page for flowers, handmade objects and workshops
- A standalone crystal bracelet studio (`bracelet.html`): templates, bead editing, undo/redo, estimated sizing, browser-local saving, and PNG design cards
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
`http://localhost:8000/bracelet.html`.

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

## Bouquet studio

Open `bouquet.html` for the standalone flower studio. Twelve illustrated materials,
category/material filters, live quantities and estimated prices, wrapping and
ribbon options, three starting palettes, rearrangement, zoom, and a message card.
Save/load and the design bag use browser-local storage; there is no payment or
order submission. Prices are samples and finishes are included. Each design is
limited to 36 stems and 12 of each material. See `assets/flowers/README.md` for
asset provenance. The homepage flower studio entry and bracelet craft switch link
to this page; the original homepage mini-builder is preserved.

The homepage **Make** dropdown links to **Crystal Bracelet** (`bracelet.html`)
and **Flower Bouquet** (`bouquet.html`). The legacy `make.html` URL redirects
to the bracelet studio; `make.html?type=bouquet` redirects to the flower studio.

Bouquet arrangements use seeded flower-head placement with overlap avoidance and
a shared stem binding. Arrange changes the composition; Undo restores the previous
arrangement seed. Saved designs reproduce their layout. Run the layout checks with
`node --test tests/bouquet-layout.test.cjs`.

Drag a flower head in the bouquet to move it while its stem remains gathered at the
ribbon. Selected flowers also support arrow keys (Shift for larger steps), and
Escape cancels an active drag. Undo restores up to 30 placement/Arrange changes;
changing flower quantities starts a new arrangement history. Manual positions are
included in saved designs and the design bag. Arrange clears manual placement;
Undo restores it. Bounds and keyboard step are configured in `arrangementRules`.

Select a flower to use the left-hand Copy, Delete, Top layer, and Bottom tools.
Copy duplicates one stem at the same artwork size, within the existing quantity
limits; Delete removes only the selected instance. Both update the estimate and
support Undo. Selecting a flower temporarily lifts it for editing; layer commands
immediately show and save its permanent stacking order. Click empty preview space
or press Escape to deselect. Saved designs include stacking order and artwork sizes.
