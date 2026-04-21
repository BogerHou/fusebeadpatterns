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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden border-2 border-brutal-black bg-white shadow-[3px_3px_0_0_#1a1a1a]">
                <div className="flex items-center justify-between gap-4 border-b-2 border-brutal-black bg-white px-4 py-3">
                    <div>
                        <div className="font-vt323 text-3xl uppercase leading-none">
                            {title}
                        </div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
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
                <div className="max-h-[calc(88vh-72px)] overflow-auto p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
