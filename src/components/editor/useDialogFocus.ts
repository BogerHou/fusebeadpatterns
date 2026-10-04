'use client';

import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

const openDialogs: HTMLElement[] = [];
const focusableSelector =
    'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable="true"]';

function getFocusableElements(dialog: HTMLElement) {
    return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled') &&
            !element.closest('[inert]') &&
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden'
        );
}

export function useDialogFocus(
    isOpen: boolean,
    onClose: () => void,
    restoreFocusFallback?: RefObject<HTMLElement | null>
) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeDialog = useEffectEvent(onClose);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;

        const trigger = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const fallbackTrigger = restoreFocusFallback?.current;
        openDialogs.push(dialog);
        const isTopDialog = () => openDialogs[openDialogs.length - 1] === dialog;
        const focusFirst = () => {
            (getFocusableElements(dialog)[0] ?? dialog).focus({ preventScroll: true });
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isTopDialog()) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeDialog();
                return;
            }
            if (event.key !== 'Tab') return;

            const elements = getFocusableElements(dialog);
            const first = elements[0];
            const last = elements[elements.length - 1];
            const active = document.activeElement;
            if (!first) {
                event.preventDefault();
                dialog.focus({ preventScroll: true });
            } else if (event.shiftKey && (active === first || !dialog.contains(active))) {
                event.preventDefault();
                last.focus({ preventScroll: true });
            } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
                event.preventDefault();
                first.focus({ preventScroll: true });
            }
        };

        const handleFocusIn = (event: FocusEvent) => {
            if (isTopDialog() && !dialog.contains(event.target as Node)) focusFirst();
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('focusin', handleFocusIn);
        focusFirst();

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('focusin', handleFocusIn);
            const index = openDialogs.lastIndexOf(dialog);
            if (index >= 0) openDialogs.splice(index, 1);
            const canRestore = (element: HTMLElement | null | undefined) =>
                element && element !== document.body && element.isConnected &&
                !element.matches(':disabled') && !element.closest('[inert]') &&
                element.getClientRects().length > 0 &&
                getComputedStyle(element).visibility !== 'hidden';
            const restoreTarget = canRestore(trigger) ? trigger : fallbackTrigger;
            if (canRestore(restoreTarget)) {
                restoreTarget.focus({ preventScroll: true });
            }
        };
    }, [isOpen, restoreFocusFallback]);

    return dialogRef;
}
