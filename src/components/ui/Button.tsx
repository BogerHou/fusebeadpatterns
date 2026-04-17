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
        'font-bold border-4 border-brutal-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-vt323 tracking-widest uppercase';

    const variants = {
        primary: 'bg-brand-purple text-brutal-black hover:bg-brand-cyan shadow-brutal',
        secondary: 'bg-white text-brutal-black hover:bg-gray-100 shadow-brutal',
        danger: 'bg-brand-magenta text-white hover:bg-red-500 shadow-brutal',
        warning: 'bg-brand-yellow text-brutal-black hover:bg-yellow-300 shadow-brutal',
        success: 'bg-brand-green text-brutal-black hover:bg-green-400 shadow-brutal',
    };

    const sizes = {
        sm: 'py-1 px-3 text-lg',
        md: 'py-2 px-6 text-xl',
        lg: 'py-3 px-8 text-2xl',
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
