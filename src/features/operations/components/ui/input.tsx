import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`h-9 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-text placeholder:text-text-muted transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-[3px] focus:ring-primary-100 focus:bg-white ${className ?? ""}`}
        {...props}
      />
    </div>
  )
);

Input.displayName = "Input";
