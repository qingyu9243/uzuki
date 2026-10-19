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
