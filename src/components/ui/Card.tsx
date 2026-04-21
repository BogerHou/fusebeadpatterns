import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
};

export const Card: React.FC<CardProps> = ({ children, title, className = '', ...props }) => {
    const contentClassName = className.includes('flex')
        ? 'min-h-0 flex flex-1 flex-col'
        : undefined;

    return (
        <div
            className={`border-4 border-brutal-black shadow-brutal p-6 ${className.includes('bg-') ? className : `bg-white ${className}`}`}
            {...props}
        >
            {title && (
                <div className="border-b-4 border-brutal-black pb-4 mb-4">
                    <h2 className="text-3xl font-vt323 tracking-wide uppercase">{title}</h2>
                </div>
            )}
            <div className={contentClassName}>{children}</div>
        </div>
    );
};
