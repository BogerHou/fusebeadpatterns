# Bead Capture — Chrome beta

Bead Capture 0.2.5 contains only the website’s **image-to-bead converter, controls, styles and fonts** inside a local Manifest V3 extension page. There is no website navigation, hero, default sample picture or pattern-library promotion. It supports Chrome 123 or later. This is an unpacked beta, not a Chrome Web Store listing.

## Build and try

Run `npm ci` and `npm run extension:build` from the repository root. The Node/zip build creates `artifacts/bead-capture-extension/` and an adjacent ZIP, both ignored by Git and excluded from the website build. Supply `--out /absolute/dedicated/output` for a separate generated folder. The script refuses to replace a nonempty directory without its own build marker.

The website and extension share `public/brand/square-bead.svg` as their icon source. The extension build uses Sharp locally to produce 16, 32, 48 and 128 px PNGs, and includes an unchanged copy of the SVG. The toolbar, extension pages and installation icon use this same design; no independent extension drawing or Vercel image transformation is involved.

Until the companion website release has been verified, the default build leaves direct website transfer unavailable with an explanatory message; local conversion and project downloads work. **After that verification**, build the user package with `npm run extension:build -- --enable-editor-transfer`. The package flag never changes the installed browser’s permissions.

Install or reload Bead Capture yourself in `chrome://extensions`. When replacing an unpacked build, reload the extension and close any older studio tabs before testing. Do not submit to the Chrome Web Store without store-specific review and listing materials.

## User workflow

1. Right-click a web image and select **Make a bead pattern**. If its host is not already covered by a grant, Chrome asks for optional HTTP/HTTPS website access directly from that click, before the conversion workspace opens. Existing grants are reused, including an earlier grant for only that image host. The toolbar icon also checks access at click time and then opens the converter with local file selection. Declining still opens the workspace: use a local file, or choose **Only allow this image host** for narrower access. Failed downloads do not reset a grant.
2. Use the same image crop, background removal, bead brands, pegboards, color reduction, preview and downloads as the website homepage. The four interface languages switch in place without losing the picture. PDF, SVG, PNG, JPG, grid PNG, XLSX and editable-project exports run locally. All homepage palette CSVs and the Japanese PDF font ship in the package.
3. Click **Edit Pattern** to pass the current generated bead grid and settings to the official website editor. A small local loading page paints before navigation; the website then displays its editor frame while loading scripts and receiving the pattern. An empty website editor opens the pattern automatically; existing work remains protected by save/replace controls. The source image, its URL, its filename and its crop are not transferred. Individual bead editing continues from the exact generated grid. Save the project and open the file on the website if a large transfer exceeds Chrome’s session budget or the bridge is unavailable.

Right-click inputs support still PNG, JPEG and WebP up to 8 MiB and 2048 pixels per side. The local file picker uses the homepage’s existing file support. Protected files, redirects, signed/expired links, blob URLs and unsupported image hosts may require saving the image and choosing that local file. Permission, file, size and connection errors are explained separately. A user’s later file selection or explicit cancellation invalidates an earlier in-flight import.

Save before closing the studio. Work in the extension is held in that tab’s memory; it does not overwrite or automatically restore the website’s saved draft. Screen colors are approximate. Use the existing export scale/paper controls for physical printing; a grid PNG is not automatically a calibrated actual-size template.

## Privacy and permissions

- `contextMenus` adds the image action and `storage` retains bounded session task records. No `activeTab`, `tabs`, `scripting`, history or cookie permission is requested.
- Website access is optional. The user can grant HTTP/HTTPS access for all websites once, or only the selected image’s exact origin. Chrome retains the grant until revoked; changing or removing site access in Chrome may require a new approval. No permission is requested automatically on page load. Even with all-websites access, the extension only fetches the image captured by the user's context-menu action; it does not scan a page’s other images or read the browsing history.
- Import contacts the image host without forwarding page cookies. Image bytes and conversion remain on this device. No extension analytics, advertising, remote executable code, iframe website shell, or image upload to our server is included.
- Source links and handoffs expire after ten minutes; expired records are removed when the extension next processes tasks. Closing the corresponding task tab removes its record. A handoff uses a one-use token bound to the newly created official editor tab. The token alone contains no image or source URL.
- Transfer records contain only validated generated cells and settings. A conservative session-memory budget limits simultaneous requests. Already delivered projects awaiting a website decision are not evicted to make room for another transfer.
- The official website’s normal analytics choice and advertising disclosure apply after opening it. The extension does not change those choices.
- Use only images you have permission to use. Generated patterns are not added to the public library.

The workspace first displays a lightweight loading frame, then displays only the selected image and its generated pattern. Locating, downloading and converting the image show progress states; permission waiting, cancellation and errors stop the animation. An image host not covered by existing access shows the permission choices above the converter; unreadable inputs show an error instead of a sample. The desktop settings panel expands with its contents instead of scrolling inside a fixed-height card. Inter/Manrope font licences and bundled dependency notices are included. Platform adapters replace Next navigation and images only in the extension bundle; production pages keep their normal Next components. All extension assets are local, and no Vercel image transformations or server functions are added.

Before distribution, verify image permission accept/deny, right-click auto-import, all key exports under the real extension CSP, brand changes, cancellation, and the deployed website handoff. Headless fixture tests are not a claim that every web image is accessible or that Google has approved the listing.
