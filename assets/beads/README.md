# Bead sample references

The seven JPEG files in `references/` were supplied by the user for a visual trial.
They are preserved unchanged, including their embedded AI-generated labels and
source attribution. They are not verified supplier product photography.

`data/beads.js` describes 14 selected samples, using normalized `[x,y,w,h]`
rectangles in the source image. The UI and PNG export clip those rectangles into
circles at render time; no generated or retouched images are used. Four original
CSS illustrations remain for backward compatibility with saved V1 designs.

The sample 6/8/10 mm variants simulate relative size, not supplier availability.
Original 8 mm IDs are preserved so old saved designs continue to load. Origin,
treatments, prices and availability are unconfirmed. Intention text is original
styling copy, not a factual claim about a stone or a promised health benefit.

To replace a reference with a verified single-bead image, update its `image` path
and use `[0,0,1,1]` for `crop` when the bead fills the square. Confirm product data
and permitted use separately before presenting a sample as an actual product.
