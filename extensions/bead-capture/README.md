# Bead Capture — Chrome beta

Bead Capture 0.2.0 reuses the website homepage’s **actual React converter, layout, controls, styles and fonts** inside a local Manifest V3 extension page. It supports Chrome 123 or later. This is an unpacked beta, not a Chrome Web Store listing.

## Build and try

Run `npm ci` and `npm run extension:build` from the repository root. The Node/zip build creates `artifacts/bead-capture-extension/` and an adjacent ZIP, both ignored by Git and excluded from the website build. Supply `--out /absolute/dedicated/output` for a separate generated folder. The script refuses to replace a nonempty directory without its own build marker.

Until the companion website release has been verified, the default build leaves direct website transfer unavailable with an explanatory message; local conversion and project downloads work. **After that verification**, build the user package with `npm run extension:build -- --enable-editor-transfer`. The package flag never changes the installed browser’s permissions.

Install or reload Bead Capture yourself in `chrome://extensions`. When replacing an unpacked build, reload the extension and close any older studio tabs before testing. Do not submit to the Chrome Web Store without store-specific review and listing materials.

## User workflow

1. Right-click a web image and select **Make a bead pattern**. The extension opens its own homepage-style converter. On first use of an image host, click **Allow image host & make pattern** and review Chrome’s exact-host request. Approved hosts load automatically on later right-click actions. The toolbar icon opens the same converter with local file selection.
2. Use the same image crop, background removal, bead brands, pegboards, color reduction, preview and downloads as the website homepage. The four interface languages switch in place without losing the picture. PDF, SVG, PNG, JPG, grid PNG, XLSX and editable-project exports run locally. All homepage palette CSVs and the Japanese PDF font ship in the package.
3. Click **Edit Pattern** (or the header’s Editor link) to pass the current generated bead grid and settings to the official website editor. An empty website editor opens the pattern automatically; existing work remains protected by save/replace controls. The source image, its URL, its filename and its crop are not transferred. Individual bead editing continues from the exact generated grid. Save the project and open the file on the website if a large transfer exceeds Chrome’s session budget or the bridge is unavailable.

Right-click inputs support still PNG, JPEG and WebP up to 8 MiB and 2048 pixels per side. The local file picker uses the homepage’s existing file support. Protected files, redirects, signed/expired links, blob URLs and unsupported image hosts may require saving the image and choosing that local file. Permission, file, size and connection errors are explained separately. A user’s later file selection or explicit cancellation invalidates an earlier in-flight import.

Save before closing the studio. Work in the extension is held in that tab’s memory; it does not overwrite or automatically restore the website’s saved draft. Screen colors are approximate. Use the existing export scale/paper controls for physical printing; a grid PNG is not automatically a calibrated actual-size template.

## Privacy and permissions

- `contextMenus` adds the image action and `storage` retains bounded session task records. No `activeTab`, `tabs`, `scripting`, history or cookie permission is requested.
- Image-host access is optional and requested only for the selected image’s exact origin. Chrome retains that permission until revoked. The extension does not scan a page’s other images or read the browsing history.
- Import contacts the image host without forwarding page cookies. Image bytes and conversion remain on this device. No extension analytics, advertising, remote executable code, iframe website shell, or image upload to our server is included.
- Source links and handoffs expire after ten minutes; expired records are removed when the extension next processes tasks. Closing the corresponding task tab removes its record. A handoff uses a one-use token bound to the newly created official editor tab. The token alone contains no image or source URL.
- Transfer records contain only validated generated cells and settings. A conservative session-memory budget limits simultaneous requests. Already delivered projects awaiting a website decision are not evicted to make room for another transfer.
- The official website’s normal analytics choice and advertising disclosure apply after opening it. The extension does not change those choices.
- Use only images you have permission to use. Generated patterns are not added to the public library.

The hero uses an existing original bat pattern in the same visual frame, avoiding redistribution of the website’s third-party character example. Original pattern data is unchanged. Inter/Manrope font licences and bundled dependency notices are included. Platform adapters replace Next navigation and images only in the extension bundle; production pages keep their normal Next components. All extension assets are local, and no Vercel image transformations or server functions are added.

Before distribution, verify image permission accept/deny, right-click auto-import, all key exports under the real extension CSP, brand changes, cancellation, and the deployed website handoff. Headless fixture tests are not a claim that every web image is accessible or that Google has approved the listing.
