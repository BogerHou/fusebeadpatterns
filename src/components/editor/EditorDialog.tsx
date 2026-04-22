import React from 'react';

type EditorDialogProps = {
    title: string;
    summary: string;
    onClose: () => void;
    children: React.ReactNode;
};

export function EditorDialog({
    title,
    summary,
    onClose,
    children,
}: EditorDialogProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/35 p-0 sm:items-center sm:justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="flex h-[100svh] w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:border-2 sm:border-brutal-black sm:shadow-[3px_3px_0_0_#1a1a1a]">
                <div className="flex items-center justify-between gap-3 border-b-2 border-brutal-black bg-white px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
                    <div>
                        <div className="font-vt323 text-2xl uppercase leading-none sm:text-3xl">
                            {title}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600 sm:text-[11px]">
                            {summary}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-brutal-black bg-white font-vt323 text-3xl leading-none hover:bg-brand-yellow sm:h-9 sm:w-9 sm:text-2xl"
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
