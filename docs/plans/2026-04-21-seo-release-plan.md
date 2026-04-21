# SEO Release Plan - 2026-04-21

**Domain:** https://fusebeadpatterns.art

**Keyword source:** `processed-data.xlsx`, first 100 rows by current spreadsheet order.

**Goal:** Ship a cleaner homepage + editor handoff now, while setting up a scalable SEO structure instead of forcing every keyword onto the homepage.

---

## 1. Why the Homepage Is Structured This Way

The first 100 keywords show four different search intents:

- **Core tool intent:** `perler bead pattern maker`, `perler bead pattern creator`, `perler bead templates`, `patterns for perler beads`.
- **Broad hobby intent:** `perler beads`, `perler bead ideas`, `perler bead designs`, `perler bead art`, `perler bead creations`.
- **Character / theme intent:** `minecraft perler bead patterns`, `pokemon perler beads`, `mario perler beads`, `hello kitty perler beads`, `stitch perler beads`, `zelda perler beads`, `christmas perler bead patterns`.
- **Material / board intent:** `perler bead pegboard`, `perler bead pegboards`, `mini perler beads`, `perler bead kit`, `perler bead storage`, `perler beads bulk`.

The homepage should therefore remain a **tool-first landing page**:

- Primary promise: convert an image into a printable bead pattern.
- Primary action: upload image, choose color brand, choose pegboard, export or edit.
- Supporting SEO: explain brand palettes, pegboards, exports, manual editor, and common project use cases.

It should not become a huge directory of every Minecraft, Pokemon, Disney, Christmas, and accessory keyword. Those should become supporting content pages.

---

## 2. Release Scope

### Must Ship Before Version

- Add structured data for `WebApplication`, `FAQPage`, and `HowTo`.
- Keep `/editor` as `noindex, follow` so it supports the homepage instead of competing with it.
- Use stable sitemap `lastModified` dates instead of `new Date()` on every request.
- Reduce unnecessary `/editor` prefetch from homepage links.
- Keep homepage upload card compact and show `Change Source` only on hover.
- Add missing file-input accessibility labels.
- Update privacy copy to match actual Google Analytics usage.

### Should Ship Soon After

- Split the homepage generator UI from the full editor UI.
- Keep shared conversion/export logic in library modules, not in one giant UI component.
- Add guide/example pages for keyword clusters.
- Add editor-specific mobile strategy instead of shrinking the desktop editor.
- Add tests for no-flicker bead editing, undo/redo, color picker, and export dialog.

---

## 3. Keyword Clusters From Top 100

### Homepage Primary Keywords

- `perler bead patterns`
- `perler bead pattern maker`
- `perler bead pattern creator`
- `perler bead templates`
- `patterns for perler beads`
- `perler beads pattern`
- `perler bead pattern`

Homepage copy should prioritize these because they match the product.

### Homepage Supporting Keywords

- `perler beads`
- `perler bead ideas`
- `perler bead designs`
- `perler beads ideas`
- `perler beads designs`
- `perler bead art`
- `perler bead pegboard`
- `perler bead pegboards`
- `mini perler beads`
- `perler bead kit`

These can be used in how-it-works, features, FAQ, and internal links.

### Future Guide Pages

- `/guides/photo-to-perler-bead-pattern`
  - Target: photo conversion and printable template intent.
- `/guides/perler-bead-pegboards`
  - Target: `perler bead pegboard`, `perler bead boards`, board sizing.
- `/guides/mini-perler-beads`
  - Target: `mini perler beads`, `mini perler bead patterns`, `tiny perler bead patterns`.
- `/guides/perler-bead-kits-and-storage`
  - Target: `perler bead kit`, `perler bead kits`, `perler bead storage`, `perler beads bulk`.

### Future Example Pages

- `/examples/minecraft-perler-bead-patterns`
- `/examples/pokemon-perler-bead-patterns`
- `/examples/mario-perler-beads`
- `/examples/hello-kitty-perler-beads`
- `/examples/christmas-perler-bead-patterns`
- `/examples/disney-perler-beads`
- `/examples/3d-perler-bead-patterns`
- `/examples/perler-bead-keychains`

These pages should link back to the generator with a concrete CTA:

> Upload your own image and turn it into a printable bead pattern.

---

## 4. Homepage Content Rules

- Do not stuff all character keywords into one section.
- Keep the generator above SEO content.
- Use examples to explain use cases, not to create a keyword list.
- Keep the editor entry visible in top navigation and in the generated-pattern flow.
- Add structured data, but keep visible content useful for humans first.

---

## 5. Editor SEO Role

The editor page should stay focused on the tool experience:

- `noindex, follow`
- no long SEO copy
- clear return link to generator
- export-focused primary action
- project settings and source image controls inside the tool shell

All public SEO storytelling about the editor belongs on the homepage or future guide pages.

---

## 6. Validation Checklist

- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`
- Browser check homepage at desktop and mobile width.
- Browser check `/editor` with imported pattern and blank pattern.
- Confirm `/sitemap.xml` uses stable `lastmod`.
- Confirm homepage has JSON-LD scripts.
- Confirm `/editor` response contains `noindex`.
