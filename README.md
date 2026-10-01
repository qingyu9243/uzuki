# Uzuki

The website for **Uzuki** — handmade flowers, tiny rituals and creative workshops.

## First release

- Brand-led landing page for flowers, handmade objects and workshops
- A client-side crystal bracelet maker prototype
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
