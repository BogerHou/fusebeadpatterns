import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject, type EditorDraft } from '../editor/draft';
import { EXPORT_OPTIONS, PALETTE_OPTIONS, getBoardOption, getDitheringOption, getMatchingOption, getPaletteOption } from '../editor/config';
import { Color } from '../core/model/color/color.model';
import { PaletteEntry } from '../core/model/palette/palette.model';

export const EXTENSION_PROJECT_QUERY = 'extension-project';
export const WEBSITE_MESSAGE_SOURCE = 'fuse-bead-website';
export const EXTENSION_MESSAGE_SOURCE = 'fuse-bead-extension';
export const WEBSITE_ORIGIN = 'https://fusebeadpatterns.art';
// Covers the editor's largest 20 × 20 mini-board grid, with bounded palette metadata.
export const MAX_HANDOFF_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const HANDOFF_TTL_MS = 10 * 60 * 1000;
export const SOURCE_TTL_MS = HANDOFF_TTL_MS;
export const EDITOR_PATHS = { en: '/editor', de: '/de/editor', fr: '/fr/editor', ja: '/ja/editor' } as const;
export type ExtensionLocale = keyof typeof EDITOR_PATHS;

export type ExtensionSource = {
    url: string;
    capturedAt: number;
    tabId?: number;
    windowId?: number;
};
export type WebsiteBridgeMessage = {
    source: typeof WEBSITE_MESSAGE_SOURCE;
    type: 'extension-ready' | 'extension-accepted' | 'extension-dismissed';
    token: string;
};
export type ExtensionProjectMessage = {
    source: typeof EXTENSION_MESSAGE_SOURCE;
    type: 'extension-project';
    token: string;
    project: string;
};
export type ExtensionErrorMessage = {
    source: typeof EXTENSION_MESSAGE_SOURCE;
    type: 'extension-error';
    token: string;
    error: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isExtensionToken(value: unknown): value is string {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Only a canonical first-party editor can receive a handoff. Other query keys,
 * duplicate tokens, credentials, fragments and alternate origins are rejected. */
export function getHandoffToken(rawUrl: string): string | null {
    try {
        const url = new URL(rawUrl);
        if (url.origin !== WEBSITE_ORIGIN || url.username || url.password || url.hash ||
            !Object.values(EDITOR_PATHS).some(path => path === url.pathname)) return null;
        const entries = [...url.searchParams.entries()];
        if (entries.length !== 1 || entries[0][0] !== EXTENSION_PROJECT_QUERY || !isExtensionToken(entries[0][1])) return null;
        return entries[0][1];
    } catch { return null; }
}

export function makeHandoffUrl(token: string, locale: ExtensionLocale = 'en'): string {
    if (!isExtensionToken(token) || !Object.hasOwn(EDITOR_PATHS, locale)) throw new Error('Invalid handoff');
    return `${WEBSITE_ORIGIN}${EDITOR_PATHS[locale]}?${EXTENSION_PROJECT_QUERY}=${token}`;
}

/** Strip the original image and its metadata before a generated homepage grid
 * leaves the extension. The returned draft can be passed to serializeEditorProject.
 * This deliberately does not turn arbitrary image imports into image handoffs. */
export function sanitizeHomepageCaptureDraft(input: EditorDraft): EditorDraft | null {
    if (!input || typeof input !== 'object') return null;
    try {
        return parseExtensionProject(serializeEditorProject({
            version: 1, sourceMode: 'blank', imageSrc: null, sourceCrop: null, sourceBackground: null,
            fileName: 'Bead Capture', selectedPaletteIds: input.selectedPaletteIds, activePalettes: input.activePalettes,
            boardId: input.boardId, boardWidth: input.boardWidth, boardHeight: input.boardHeight,
            matchingId: input.matchingId, ditheringId: input.ditheringId, maxBeadColors: input.maxBeadColors,
            useSymbols: input.useSymbols, exportFormatId: input.exportFormatId,
            pdfScaleMode: input.pdfScaleMode, pdfPaperSize: input.pdfPaperSize,
            imageAdjustments: input.imageAdjustments, rendererSettings: input.rendererSettings,
            previewZoom: input.previewZoom, editedPattern: input.editedPattern,
        }));
    } catch { return null; }
}

/** Limit the transport before parsing, and carry only a detached bead grid.
 * Original images, source addresses and unrelated editor state do not cross. */
export function parseExtensionProject(raw: unknown): EditorDraft | null {
    if (typeof raw !== 'string' || raw.length > MAX_HANDOFF_BYTES || new TextEncoder().encode(raw).byteLength > MAX_HANDOFF_BYTES) return null;
    const draft = parseEditorProject(raw);
    if (!draft || draft.sourceMode !== 'blank' || draft.imageSrc !== null || draft.sourceCrop || draft.sourceBackground ||
        draft.selectedPaletteIds.length > PALETTE_OPTIONS.length ||
        new Set(draft.selectedPaletteIds).size !== draft.selectedPaletteIds.length ||
        draft.activePalettes.length !== draft.selectedPaletteIds.length || !draft.editedPattern ||
        draft.fileName.length > 120 || !getMatchingOption(draft.matchingId) || !getDitheringOption(draft.ditheringId) ||
        !EXPORT_OPTIONS.some(option => option.id === draft.exportFormatId) ||
        draft.previewZoom < 0.5 || draft.previewZoom > 5) return null;
    const board = getBoardOption(draft.boardId);
    const palettes = draft.selectedPaletteIds.map(getPaletteOption);
    const pattern = draft.editedPattern;
    // The homepage lets people choose the board independently of the brand.
    // PaletteOption.boardId seeds a new workspace; it does not constrain an
    // already generated grid (for example, Artkal S on 29-cell midi boards).
    if (!board || palettes.some(palette => !palette) ||
        pattern.width !== draft.boardWidth * board.beadsPerRow || pattern.height !== draft.boardHeight * board.beadsPerRow) return null;
    const adjustments = draft.imageAdjustments;
    if ([adjustments.brightness, adjustments.contrast, adjustments.saturation].some(value => value < 0 || value > 200) ||
        adjustments.grayscale < 0 || adjustments.grayscale > 100) return null;
    for (const [index, active] of draft.activePalettes.entries()) {
        if (active.name !== palettes[index]!.label || !active.entries.length || active.entries.length > 512 ||
            !active.entries.every(entry => entry.name.length <= 120 && entry.ref.length <= 40 && entry.symbol.length <= 8 && entry.prefix === palettes[index]!.prefix &&
                [entry.color.r, entry.color.g, entry.color.b].every(value => Number.isInteger(value) && value >= 0 && value <= 255) && entry.color.a === 255)) return null;
    }
    const pixels = decodeEditorPatternDraft(pattern);
    if (!pixels) return null;
    const allowed = new Set(draft.activePalettes.flatMap(active => active.entries.filter(entry => entry.enabled)
        .map(entry => `${entry.color.r},${entry.color.g},${entry.color.b}`)));
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) continue;
        if (pixels[i + 3] !== 255 || !allowed.has(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)) return null;
    }
    // The general project parser intentionally preserves unknown fields for
    // compatibility. The extension transport does not: reconstruct every level
    // so hidden image URLs or other caller data cannot hitchhike in a project.
    return {
        version: 1, sourceMode: 'blank', imageSrc: null, sourceCrop: null, sourceBackground: null,
        maxBeadColors: draft.maxBeadColors ?? null, fileName: 'Bead Capture', selectedPaletteIds: [...draft.selectedPaletteIds],
        activePalettes: draft.activePalettes.map((active, index) => ({ name: palettes[index]!.label, entries: active.entries.map(entry => {
            const safeEntry = new PaletteEntry(entry.name, new Color(entry.color.r, entry.color.g, entry.color.b, entry.color.a));
            safeEntry.ref = entry.ref; safeEntry.symbol = entry.symbol; safeEntry.prefix = entry.prefix; safeEntry.enabled = entry.enabled;
            return safeEntry;
        }) })),
        boardId: board.id, boardWidth: draft.boardWidth, boardHeight: draft.boardHeight,
        matchingId: draft.matchingId, ditheringId: draft.ditheringId, useSymbols: draft.useSymbols, exportFormatId: draft.exportFormatId,
        pdfScaleMode: draft.pdfScaleMode, pdfPaperSize: draft.pdfPaperSize,
        imageAdjustments: { brightness: adjustments.brightness, contrast: adjustments.contrast, saturation: adjustments.saturation, grayscale: adjustments.grayscale },
        rendererSettings: { center: draft.rendererSettings.center, fit: draft.rendererSettings.fit, showGrid: draft.rendererSettings.showGrid },
        previewZoom: draft.previewZoom,
        editedPattern: { width: pattern.width, height: pattern.height, byteLength: pattern.byteLength, data: pattern.data },
    };
}

export function isWebsiteBridgeMessage(value: unknown, token: string): value is WebsiteBridgeMessage {
    return isRecord(value) && value.source === WEBSITE_MESSAGE_SOURCE && value.token === token && isExtensionToken(token) &&
        ['extension-ready', 'extension-accepted', 'extension-dismissed'].includes(value.type as string);
}

export function isExtensionProjectMessage(value: unknown, token: string): value is ExtensionProjectMessage {
    return isRecord(value) && value.source === EXTENSION_MESSAGE_SOURCE && value.type === 'extension-project' &&
        value.token === token && isExtensionToken(token) && typeof value.project === 'string' && value.project.length <= MAX_HANDOFF_BYTES;
}

/** Public DNS names only. No credentials, private/local address literals,
 * nonstandard ports or redirects; requests also require an explicit host grant.
 * This is URL validation, not a claim to resolve or attest a domain's DNS. */
export function getImageOriginPattern(rawUrl: unknown): string | null {
    if (typeof rawUrl !== 'string' || rawUrl.length > 8192) return null;
    try {
        const url = new URL(rawUrl);
        const host = url.hostname.toLowerCase();
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port ||
            host.length > 253 || !host.includes('.') || /[^a-z0-9.-]/.test(host) || /^\d+(?:\.\d+)*$/.test(host) ||
            host.split('.').some(label => !label || label.startsWith('-') || label.endsWith('-') || label.length > 63) ||
            /(?:^|\.)(?:localhost|local|internal|home|lan|test|invalid|example|onion)$/.test(host)) return null;
        return `${url.origin}/*`;
    } catch { return null; }
}

export function isFreshTimestamp(value: unknown, now = Date.now(), ttl = HANDOFF_TTL_MS): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value <= now && now - value < ttl;
}

export type HandoffBinding = { token: string; tabId: number; targetUrl: string; createdAt: number };
export type BridgeSender = { id?: string; url?: string; frameId?: number; tab?: { id?: number } };

export function isAuthorizedHandoffSender(binding: HandoffBinding, sender: BridgeSender, extensionId: string, token: unknown, now = Date.now()): boolean {
    return isExtensionToken(token) && token === binding.token && isFreshTimestamp(binding.createdAt, now) &&
        sender.id === extensionId && sender.frameId === 0 && sender.tab?.id === binding.tabId &&
        typeof sender.url === 'string' && sender.url === binding.targetUrl && getHandoffToken(sender.url) === token;
}

/** The website removes its one-time query as soon as the person accepts or
 * declines. Finish may race that history update, but cannot change editor paths. */
export function isAuthorizedHandoffFinish(binding: HandoffBinding, sender: BridgeSender, extensionId: string, token: unknown, now = Date.now()): boolean {
    if (isAuthorizedHandoffSender(binding, sender, extensionId, token, now)) return true;
    if (!isExtensionToken(token) || token !== binding.token || !isFreshTimestamp(binding.createdAt, now) ||
        sender.id !== extensionId || sender.frameId !== 0 || sender.tab?.id !== binding.tabId || typeof sender.url !== 'string') return false;
    try {
        const original = new URL(binding.targetUrl), current = new URL(sender.url);
        return getHandoffToken(binding.targetUrl) === token && current.origin === WEBSITE_ORIGIN &&
            current.pathname === original.pathname && !current.search && !current.hash && !current.username && !current.password;
    } catch { return false; }
}

export function isStudioSender(sender: BridgeSender, extensionId: string): boolean {
    if (sender.id !== extensionId || typeof sender.url !== 'string' || (sender.frameId !== undefined && sender.frameId !== 0)) return false;
    try {
        const url = new URL(sender.url);
        const entries = [...url.searchParams.entries()];
        return url.protocol === 'chrome-extension:' && url.hostname === extensionId && url.pathname === '/studio.html' && !url.hash &&
            (entries.length === 0 || (entries.length === 1 && entries[0][0] === 'source' && isExtensionToken(entries[0][1])));
    } catch { return false; }
}

export function isAuthorizedSourceSender(sender: BridgeSender, extensionId: string, token: unknown, studioTabId?: number): boolean {
    if (!isExtensionToken(token) || !isStudioSender(sender, extensionId) ||
        (studioTabId !== undefined && sender.tab?.id !== undefined && sender.tab.id !== studioTabId)) return false;
    return new URL(sender.url!).searchParams.get('source') === token;
}
