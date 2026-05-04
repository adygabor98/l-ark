import { useRef, type ReactElement, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'default';

interface PropTypes {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    htmlType?: 'button' | 'submit' | 'reset';
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const springVariants: ButtonVariant[] = ['primary', 'secondary'];

const variantStyles: Record<ButtonVariant, string> = {
    primary:   'bg-primary text-primary-foreground font-[Lato-Bold] rounded-sm btn-shadow-primary hover:bg-primary/85 hover:scale-[1.05] hover:btn-shadow-primary-hover active:btn-shadow-primary-inset',
    secondary: 'bg-secondary text-secondary-foreground font-[Lato-Regular] rounded-sm shadow-sm border border-border/60 hover:bg-secondary/70 hover:scale-[1.05] hover:shadow-md hover:shadow-black/8 active:btn-shadow-secondary-inset',
    danger:    'bg-destructive text-destructive-foreground font-[Lato-Bold] rounded-sm shadow-lg shadow-destructive/20 hover:bg-destructive/85',
    ghost:     'text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full',
    link:      'text-muted-foreground hover:text-primary hover:underline font-[Lato-Regular]',
    icon:      'text-muted-foreground hover:bg-secondary/50 rounded-full',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1 text-xs gap-1.5',
    md: 'px-6 py-2 text-sm gap-2',
    lg: 'px-8 py-3 text-base gap-2',
    default: 'p-3'
};

const noRippleVariants: ButtonVariant[] = ['link', 'ghost'];
const noMinWidthVariants: ButtonVariant[] = ['ghost', 'link', 'icon'];

const Button = (props: PropTypes): ReactElement => {
    const { children, className = '', variant = 'primary', size = (variant ?? 'primary') === 'icon' ? 'default' : 'md', disabled, loading, loadingText, htmlType = 'button', onClick } = props;
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = buttonRef.current;
        if (button && !noRippleVariants.includes(variant)) {
            // Spring ripple
            const rect = button.getBoundingClientRect();
            const sz = Math.max(rect.width, rect.height) * 2.5;
            const x = e.clientX - rect.left - sz / 2;
            const y = e.clientY - rect.top - sz / 2;
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute; width: ${sz}px; height: ${sz}px;
                left: ${x}px; top: ${y}px;
                background: rgba(255,255,255,0.28);
                border-radius: 50%; pointer-events: none;
            `;
            button.appendChild(ripple);
            ripple.animate(
                [
                    { transform: 'scale(0)', opacity: 1 },
                    { transform: 'scale(0.6)', opacity: 0.55, offset: 0.45 },
                    { transform: 'scale(1)', opacity: 0 },
                ],
                { duration: 900, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' }
            ).onfinish = () => ripple.remove();

            // Spring click: compress → overshoot → settle
            if (springVariants.includes(variant)) {
                button.animate(
                    [
                        { transform: 'scale(1)' },
                        { transform: 'scale(0.95)', offset: 0.18 },
                        { transform: 'scale(1.04)', offset: 0.58 },
                        { transform: 'scale(1)' },
                    ],
                    { duration: 650, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                );
            }
        }
        onClick?.(e);
    };

    return (
        <button
            ref={buttonRef}
            type={htmlType}
            data-variant={variant}
            disabled={disabled || loading}
            className={`
                relative overflow-hidden inline-flex items-center justify-center cursor-pointer
                transition-[background-color,box-shadow,opacity,transform] duration-200
                ${noMinWidthVariants.includes(variant) ? '' : 'min-w-25'}
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${(disabled || loading) ? 'pointer-events-none opacity-60' : ''}
                ${className}
            `}
            onClick={handleClick}
        >
            { loadingText ? (
                <>
                    <span className={`transition-opacity duration-200 ${loading ? 'opacity-0 absolute' : 'opacity-100'}`}>{ children }</span>
                    <span className={`transition-opacity duration-200 ${loading ? 'opacity-100' : 'opacity-0 absolute'}`}>{ loadingText }</span>
                </>
            ) : children }
        </button>
    );
}

export default Button;
