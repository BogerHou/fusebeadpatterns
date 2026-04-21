import React from 'react';

type EditorSectionProps = {
    title: string;
    children: React.ReactNode;
};

export function EditorSection({ title, children }: EditorSectionProps) {
    return (
        <section className="space-y-1.5 border-t-2 border-brutal-black/15 pt-2 first:border-t-0 first:pt-0 sm:border-t-4 sm:pt-2.5">
            <div className="font-vt323 text-[1.25rem] uppercase leading-none text-brutal-black sm:text-[1.7rem]">
                {title}
            </div>
            {children}
        </section>
    );
}
