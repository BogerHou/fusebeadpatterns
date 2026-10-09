# Localized 404 recovery

The site uses Next 16.3.8 with four separate root layouts and experimental `globalNotFound`, not `output: 'export'`. Keep the global document independent of the ordinary roots. No catch-all route, middleware, cookie redirect, canonical or hreflang is added for nonexistent pages.

`global-not-found.tsx` retains its English title and noindex metadata. The shared document initially renders a complete English 404. It does **not** claim to know an unmatched request's locale while prerendering. After hydration, `NotFoundDocument` reads the real browser pathname and changes the document's `lang`, title, visible message, header, footer and recovery URLs together. Its pathname context also makes both language menus render correct static links and fallback labels for copying or opening in another tab. Ordinary pages do not provide this override. `useSyncExternalStore` supplies a stable server pathname; `usePathname` updates handle router path changes, while `popstate` handles browser Back. The complete pathname snapshot updates the menus even between two unknown URLs in the same language. Only complete first segments `de`, `fr` and `ja` select those languages: `/dead`, `/france`, `/japan` and unsupported prefixes remain English.

This is browser recovery, not native-language initial server HTML. With JavaScript disabled, the complete English fallback remains usable. Do not present localized text inside a serialized RSC script as visible server output. Browser QA must check hydration, changing paths, Back, all four recovery journeys, console errors and subsequent ordinary-page metadata.

Next can apply its English server title after the first client effect. The mounted global 404 therefore observes document mutations and restores its current native title when necessary, without a timer. Observing the document root also covers replacement of the head element. The observer disconnects on unmount; it also checks that the same 404 content is still connected before writing, so a normal page's metadata remains authoritative during navigation. No extra title element is rendered.

Run from the worktree:

```sh
npx vitest run src/lib/i18n/not-found.test.ts src/lib/i18n/not-found-title.test.ts src/components/layout/NotFoundDocument.test.ts
npm run typecheck
npm run lint
npm run build
npm run start -- --hostname 127.0.0.1 --port 4391
node scripts/check-localized-404-recovery.mjs http://127.0.0.1:4391
```

The four guide routes already enumerate their complete set of published slugs. `dynamicParams = false` makes unpublished guide slugs reach the same global 404 before attempting to render a runtime page. This also prevents the empty `__next_error__` initial document observed with these unmatched runtime pages and multiple roots. Published guide parameters, copy and metadata are unchanged.

The HTTP check reads production-build responses without a browser and asserts real 404/noindex, a complete initial fallback, no invented alternate/canonical URL, invalid-prefix behavior, nested nonexistent paths and four ordinary home pages. It does not claim to validate hydration. Unit checks render the actual shared content, header, footer and language menu, then check native browser snapshots, complete-prefix matching and popstate cleanup.
