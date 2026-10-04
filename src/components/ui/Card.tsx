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
            className={`rounded-xl border border-[#d9ded5] shadow-[0_4px_20px_-12px_#243e3626] p-6 ${className.includes('bg-') ? className : `bg-white ${className}`}`}
            {...props}
        >
            {title && (
                <div className="mb-4 border-b border-[#d9ded5] pb-4">
                    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                </div>
            )}
            <div className={contentClassName}>{children}</div>
        </div>
    );
};
