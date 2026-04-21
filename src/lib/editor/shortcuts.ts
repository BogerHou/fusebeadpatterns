export type EditorShortcutTool = 'bead' | 'fill' | 'erase' | 'pick' | 'pan';

export type EditorShortcutAction =
    | { type: 'undo' }
    | { type: 'redo' }
    | { type: 'set-tool'; tool: EditorShortcutTool }
    | { type: 'adjust-preview-zoom'; direction: -1 | 1 }
    | { type: 'close-color-picker' };

export type EditorShortcutContext = {
    hasPreview: boolean;
    isColorPickerOpen: boolean;
};

export type EditorShortcutKeyboardEvent = {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
};

const TOOL_SHORTCUTS: Record<string, EditorShortcutTool> = {
    b: 'bead',
    f: 'fill',
    e: 'erase',
    i: 'pick',
    p: 'pan',
};

export function getEditorShortcutAction(
    event: EditorShortcutKeyboardEvent,
    context: EditorShortcutContext
): EditorShortcutAction | null {
    const key = event.key.toLowerCase();
    const hasPrimaryModifier = event.ctrlKey || event.metaKey;

    if (hasPrimaryModifier && key === 'z') {
        return event.shiftKey ? { type: 'redo' } : { type: 'undo' };
    }

    if (hasPrimaryModifier && key === 'y') {
        return { type: 'redo' };
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
        return null;
    }

    const tool = TOOL_SHORTCUTS[key];

    if (tool) {
        return {
            type: 'set-tool',
            tool,
        };
    }

    if ((key === '-' || key === '_') && context.hasPreview) {
        return {
            type: 'adjust-preview-zoom',
            direction: -1,
        };
    }

    if ((key === '=' || key === '+') && context.hasPreview) {
        return {
            type: 'adjust-preview-zoom',
            direction: 1,
        };
    }

    if (key === 'escape' && context.isColorPickerOpen) {
        return { type: 'close-color-picker' };
    }

    return null;
}
