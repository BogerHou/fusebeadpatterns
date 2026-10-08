import japaneseLibrary from '../patterns/japanese.json';
import {
    JAPANESE_PROJECT_MAX_BYTES, inspectJapaneseProject, loadJapanesePalette,
    restoreJapaneseProject, type JapanesePattern,
} from './generator';

export type JapaneseLibraryProject = Readonly<{
    id: string;
    name: string;
    version: string;
    projectUrl: string;
}>;

// Only the reviewed, visible Japanese collection can be opened from a URL.
// Query values never become paths or external fetch targets.
const projects = new Map<string, JapaneseLibraryProject>(japaneseLibrary.groups.flatMap(group => group.patterns.map(pattern => [pattern.id, Object.freeze({
    ...pattern,
    version: group.version,
    projectUrl: `/patterns/${pattern.id}/pattern.bead-pattern.json`,
})] as const)));

export function getJapaneseLibraryProject(id: string | null): JapaneseLibraryProject | null {
    return id ? projects.get(id) ?? null : null;
}

export type JapaneseLibrarySelection = { kind: 'none' } | { kind: 'invalid' } | { kind: 'project'; project: JapaneseLibraryProject };

export function selectJapaneseLibraryProject(values: readonly string[]): JapaneseLibrarySelection {
    if (values.length === 0) return { kind: 'none' };
    const project = values.length === 1 ? getJapaneseLibraryProject(values[0]) : null;
    return project ? { kind: 'project', project } : { kind: 'invalid' };
}

export class JapaneseLibraryProjectError extends Error {
    constructor(invalidSelection = false) {
        super(invalidSelection
            ? 'この図案リンクは開けません。日本語の図案一覧から選び直してください。現在の図案は残っています。'
            : '図案を読み込めませんでした。接続を確認して、もう一度お試しください。現在の図案は残っています。');
        this.name = 'JapaneseLibraryProjectError';
    }
}

function checkAbort(signal?: AbortSignal) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
}

/** Return a completely validated, independent model; the caller decides whether to replace its draft. */
export async function loadJapaneseLibraryProject(id: string, signal?: AbortSignal): Promise<JapanesePattern> {
    const project = getJapaneseLibraryProject(id);
    if (!project) throw new JapaneseLibraryProjectError(true);
    checkAbort(signal);
    try {
        const response = await fetch(project.projectUrl, { signal, redirect: 'error' });
        if (!response.ok || response.redirected || Number(response.headers.get('content-length') || 0) > JAPANESE_PROJECT_MAX_BYTES) throw new JapaneseLibraryProjectError();
        const raw = await response.text();
        checkAbort(signal);
        if (new TextEncoder().encode(raw).byteLength > JAPANESE_PROJECT_MAX_BYTES) throw new JapaneseLibraryProjectError();
        const { paletteId } = inspectJapaneseProject(raw);
        const palette = await loadJapanesePalette(paletteId, signal);
        checkAbort(signal);
        return restoreJapaneseProject(raw, palette);
    } catch (error) {
        checkAbort(signal);
        throw error instanceof JapaneseLibraryProjectError ? error : new JapaneseLibraryProjectError();
    }
}
