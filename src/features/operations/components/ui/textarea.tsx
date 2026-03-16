import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`w-full rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted transition-all duration-200 resize-none focus:border-primary-400 focus:outline-none focus:ring-[3px] focus:ring-primary-100 focus:bg-white ${className ?? ""}`}
        rows={3}
        {...props}
      />
    </div>
  )
);

Textarea.displayName = "Textarea";
