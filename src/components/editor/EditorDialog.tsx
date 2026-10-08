import React from 'react';
import { useDialogFocus } from './useDialogFocus';

type EditorDialogProps = {
    title: string;
    summary: string;
    onClose: () => void;
    restoreFocusFallback?: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
};

export function EditorDialog({
    title,
    summary,
    onClose,
    restoreFocusFallback,
    children,
}: EditorDialogProps) {
    const dialogRef = useDialogFocus(true, onClose, restoreFocusFallback);

    return (
        <div
            ref={dialogRef}
            tabIndex={-1}
            className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-[#243e36]/35 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="flex h-[100svh] w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:rounded-xl sm:border sm:border-[#d9ded5] sm:shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-[#d9ded5] bg-[#f7f6f2] px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
                    <div>
                        <div className="text-lg font-semibold leading-tight">
                            {title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-[#627168]">
                            {summary}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d9ded5] bg-white text-2xl leading-none transition-colors hover:bg-brand-cyan sm:h-9 sm:w-9"
                        aria-label={`Close ${title}`}
                    >
                        &times;
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3 sm:max-h-[calc(88vh-72px)] sm:p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
