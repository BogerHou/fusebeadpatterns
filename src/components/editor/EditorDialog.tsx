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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden border-2 border-brutal-black bg-white shadow-[2px_2px_0_0_#1a1a1a] sm:shadow-[3px_3px_0_0_#1a1a1a]">
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
                        className="border-2 border-brutal-black bg-white px-2 py-0.5 font-vt323 text-2xl leading-none hover:bg-brand-yellow"
                        aria-label={`Close ${title}`}
                    >
                        &times;
                    </button>
                </div>
                <div className="max-h-[calc(88vh-64px)] overflow-auto p-3 sm:max-h-[calc(88vh-72px)] sm:p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
