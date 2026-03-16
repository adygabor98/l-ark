import { type ReactNode } from "react";

const dotColors = {
  default: "bg-primary-400",
  blocking: "bg-amber-500",
  required: "bg-indigo-500",
  success: "bg-emerald-500",
  info: "bg-blue-500",
} as const;

const variants = {
  default: "bg-primary-50 text-primary-700 border-primary-200/60",
  blocking: "bg-amber-50 text-amber-700 border-amber-200/60",
  required: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  info: "bg-blue-50 text-blue-700 border-blue-200/60",
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-tight ${variants[variant]} ${className ?? ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />
      {children}
    </span>
  );
}
