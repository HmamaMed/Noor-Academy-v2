# Noor Academy logo refinement

The owner's confirmed vision is enlightenment through learning: curiosity, knowledge, clarity, and personal growth across subjects. The academy is not positioned as an Islamic institution. Islamic courses may be a future subject, rather than the academy's defining identity.

The refinement keeps the existing Arabic Noor calligraphic idea as an expression of the name. It removes the enclosing rectangle, contrasting outlines, and long underline, balances the mark against a readable English wordmark, and uses the website palette:

| Role | Colour |
| --- | --- |
| Main mark and wordmark | Forest green `#163D35` |
| Accent dot | Muted gold `#B58A43` |
| Suggested light background | Warm ivory `#F7F5EF` |

The primary deliverable is a new transparent PNG, `frontend/public/img/noor-academy-refined-v2.png`. The four original logo files are retained. The standalone [preview](index.html) shows the proposal at large size, in a compact navigation layout, and reversed on a dark background. The preview uses a CSS viewport to hide excess transparent export margins without modifying the PNG. Its reversed treatment uses a CSS filter for a one-colour rendering; it is not a separate master file.

This is a visual refinement proposal, created with the built-in image generation tool. It is raster artwork, not a vector master. Inspect the Arabic letterforms and small-size readability before adopting it. A final SVG should be prepared from an approved drawing, rather than claiming that the PNG is vector artwork.

The site's shared brand component now displays this supplied refinement. The public header uses the horizontal lockup; the sidebar and account forms use a stacked composition; the footer uses the symbol. All three reuse SVG viewports over the same PNG, preserving the original artwork and avoiding references to missing derivative files. The stacked layout and symbol are presentations of the existing raster, not new vector masters. The existing favicon remains in use until a dedicated small icon is supplied. Course records are unchanged; the design brief records the corrected positioning.

See [the generation prompt](refinement-prompt.txt) for the complete instructions used.
