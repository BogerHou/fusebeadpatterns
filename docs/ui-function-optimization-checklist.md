# UI And Function Optimization Checklist

This checklist tracks the remaining work after the April 2026 UI, content, and launch review.

## Next

- [ ] Reduce export chunk weight by moving PDF/SVG font payloads out of JavaScript or loading them as static assets.
- [ ] Add client-side error monitoring for editor failures.
- [ ] Split `Editor.tsx` in phases: project I/O helpers, mobile panels, export dialog, then drawing state.

## Performance Boundary

- First-screen performance should be judged on the home and editor shell bundles, not the async export chunks.
- The current largest chunks are tied to export libraries and embedded PDF/SVG font payloads. They are acceptable only because they load behind export actions; the next optimization should move the font payloads to static assets or another lazy boundary.
- Keep a visible loading state before PDF/SVG/XLSX export work, because export remains the slowest user-facing path.

## Content And SEO

- [ ] Expand guides into a clear topic tree instead of isolated articles.
- [ ] Add practical screenshots or examples to high-value guide pages.
- [ ] Change footer guide links to grouped category links once the guide count grows past 8-10 pages.

## SEO Content Tree Plan

- `/`: primary generator and conversion entry point.
- `/editor`: advanced editing workflow for users who already have or want to refine a pattern.
- `/guides`: guide index grouped by intent.
- `/guides/photo-to-perler-bead-pattern`: photo conversion guide.
- `/guides/perler-bead-pattern-size-guide`: board and pattern sizing guide.
- `/guides/perler-hama-artkal-color-palettes`: brand palette comparison guide.
- `/about`, `/privacy-policy`, `/terms-of-service`: trust and legal pages.

## Launch Operations

- [ ] Confirm Google Search Console setup and sitemap submission.
- [ ] Review analytics and privacy copy after confirming the final tracking setup.

## Done

- [x] Add a simple responsive editor control surface for tablet and mobile users.
- [x] Add a minimal project save/open workflow separate from final PDF/SVG/PNG/XLSX export.
- [x] Add large-project safeguards: clear bead-count warning, slow-operation warning, and a cancel/retry path.
- [x] Improve export failure messages with practical recovery suggestions.
- [x] Simplify oversized editor dialogs, especially Color Picker and Export, so they feel lighter and less rigid.
- [x] Fix CI branch coverage so pushes to `master` run the quality workflow.
- [x] Add a repeatable production smoke check for `/`, `/editor`, `/guides`, `/sitemap.xml`, and `/robots.txt`.
- [x] Add a focused mobile editor smoke test for blank pattern creation, color picker, canvas editing, and export dialog.
- [x] Extend the mobile smoke test to cover home pinch zoom, changed image regeneration, editor entry, and project save/open round trips.
- [x] Add site-wide security headers and hide the `X-Powered-By` response header.
- [x] Add a local `predeploy` command that runs verify, audit, production smoke, and mobile editor smoke against a local production server.
- [x] Make footer copyright year deterministic to avoid date-based hydration drift.
- [x] Show an export loading state before loading large PDF/SVG/XLSX chunks.
- [x] Clear the npm audit warning by updating the transitive `dompurify` lockfile entry.
- [x] Create a project-level rule to keep content pages simple and avoid over-decorated internal navigation.
- [x] Keep the simplified internal page structure: breadcrumb first, readable content, simple next-step links.
- [x] Simplify local guide pages by removing the heavy `Guide Tree` panels.
- [x] Simplify the local editor top bar so it no longer competes with the homepage style.
