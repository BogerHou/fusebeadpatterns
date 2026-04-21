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
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden border-4 border-brutal-black bg-white shadow-brutal">
                <div className="flex items-center justify-between gap-4 border-b-4 border-brutal-black bg-brand-yellow px-5 py-4">
                    <div>
                        <div className="font-vt323 text-4xl uppercase leading-none">
                            {title}
                        </div>
                        <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-gray-700">
                            {summary}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="border-4 border-brutal-black bg-white px-3 py-1 font-vt323 text-3xl leading-none shadow-brutal"
                        aria-label={`Close ${title}`}
                    >
                        &times;
                    </button>
                </div>
                <div className="max-h-[calc(90vh-92px)] overflow-auto p-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
