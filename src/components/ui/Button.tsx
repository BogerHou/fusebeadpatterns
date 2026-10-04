import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
    size?: 'sm' | 'md' | 'lg';
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles =
        'rounded-lg border font-sans font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28614e] disabled:cursor-not-allowed disabled:opacity-50';

    const variants = {
        primary: 'border-[#28614e] bg-[#28614e] text-white hover:bg-[#214f40]',
        secondary: 'border-[#d9ded5] bg-white text-brutal-black hover:bg-[#f0f3ed]',
        danger: 'border-[#b5444a] bg-brand-magenta text-white hover:bg-[#983a40]',
        warning: 'border-[#ded5a2] bg-brand-yellow text-brutal-black hover:bg-[#e7ddab]',
        success: 'border-[#cadbc9] bg-brand-green text-brutal-black hover:bg-[#cfdfce]',
    };

    const sizes = {
        sm: 'py-1.5 px-3 text-sm',
        md: 'py-2.5 px-5 text-sm',
        lg: 'py-3 px-7 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
