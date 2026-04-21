import { describe, expect, it } from 'vitest';

import {
    getEditorShortcutAction,
    type EditorShortcutKeyboardEvent,
} from './shortcuts';

function createEvent(
    input: Partial<EditorShortcutKeyboardEvent> & { key: string }
): EditorShortcutKeyboardEvent {
    return {
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        ...input,
    };
}

describe('editor shortcut helpers', () => {
    it('maps undo and redo shortcuts before ignoring modified tool keys', () => {
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'z', ctrlKey: true }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'undo' });

        expect(
            getEditorShortcutAction(
                createEvent({ key: 'z', metaKey: true, shiftKey: true }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'redo' });

        expect(
            getEditorShortcutAction(
                createEvent({ key: 'y', ctrlKey: true }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'redo' });

        expect(
            getEditorShortcutAction(
                createEvent({ key: 'b', ctrlKey: true }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toBeNull();
    });

    it('maps plain tool shortcuts', () => {
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'B' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'set-tool', tool: 'bead' });
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'f' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'set-tool', tool: 'fill' });
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'e' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'set-tool', tool: 'erase' });
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'i' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'set-tool', tool: 'pick' });
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'p' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'set-tool', tool: 'pan' });
    });

    it('only maps zoom shortcuts when a preview is available', () => {
        expect(
            getEditorShortcutAction(
                createEvent({ key: '-' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'adjust-preview-zoom', direction: -1 });

        expect(
            getEditorShortcutAction(
                createEvent({ key: '+' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toEqual({ type: 'adjust-preview-zoom', direction: 1 });

        expect(
            getEditorShortcutAction(
                createEvent({ key: '=' }),
                { hasPreview: false, isColorPickerOpen: false }
            )
        ).toBeNull();
    });

    it('closes the color picker on escape only when it is open', () => {
        expect(
            getEditorShortcutAction(
                createEvent({ key: 'Escape' }),
                { hasPreview: true, isColorPickerOpen: true }
            )
        ).toEqual({ type: 'close-color-picker' });

        expect(
            getEditorShortcutAction(
                createEvent({ key: 'Escape' }),
                { hasPreview: true, isColorPickerOpen: false }
            )
        ).toBeNull();
    });
});
