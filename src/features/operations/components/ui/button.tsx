import { type ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md hover:shadow-lg hover:from-primary-700 hover:to-primary-600 hover:-translate-y-[1px]",
  secondary:
    "bg-white text-text border border-border shadow-xs hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 hover:-translate-y-[1px] hover:shadow-sm",
  ghost: "text-text-secondary hover:bg-primary-50 hover:text-primary-700",
  danger: "bg-white text-danger border border-red-200 hover:bg-red-50 hover:border-red-300 shadow-xs hover:shadow-sm",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
  icon: "h-9 w-9 p-0",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
