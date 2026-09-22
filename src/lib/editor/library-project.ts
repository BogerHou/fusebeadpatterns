import { getLibraryProject } from '../patterns/project-links';
import { parseEditorProject, type EditorDraft } from './draft';

/** Only bundled library IDs can request a project; query strings never become URLs. */
export async function loadLibraryEditorProject(
    patternId: string,
    signal: AbortSignal,
    fetchProject: typeof fetch = fetch
): Promise<EditorDraft> {
    const project = getLibraryProject(patternId);

    if (!project) {
        throw new Error('This pattern is not in the library. Your current project has not changed.');
    }

    signal.throwIfAborted();
    const response = await fetchProject(project.projectUrl, {
        signal,
        credentials: 'omit',
        redirect: 'error',
    });

    if (!response.ok) {
        throw new Error('The pattern could not be loaded. Please try again. Your current project has not changed.');
    }

    const contents = await response.text();
    // Cancellation also wins when a response has already reached the browser.
    signal.throwIfAborted();
    const draft = parseEditorProject(contents);

    if (!draft || !draft.editedPattern || draft.activePalettes.length === 0) {
        throw new Error('The pattern file could not be opened. Your current project has not changed.');
    }

    return draft;
}
