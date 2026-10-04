import React from 'react';

type EditorSectionProps = {
    title: string;
    children: React.ReactNode;
};

export function EditorSection({ title, children }: EditorSectionProps) {
    return (
        <section className="space-y-2 border-t border-[#d9ded5] pt-3 first:border-t-0 first:pt-0">
            <div className="text-sm font-semibold leading-5 text-brutal-black">
                {title}
            </div>
            {children}
        </section>
    );
}
