import React from 'react';

type EditorSectionProps = {
    title: string;
    children: React.ReactNode;
};

export function EditorSection({ title, children }: EditorSectionProps) {
    return (
        <section className="space-y-1.5 border-t-4 border-brutal-black/15 pt-2.5 first:border-t-0 first:pt-0">
            <div className="font-vt323 text-[1.7rem] uppercase leading-none text-brutal-black">
                {title}
            </div>
            {children}
        </section>
    );
}
