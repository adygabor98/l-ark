import * as React from "react";
import {
	cva,
	type VariantProps
} from "class-variance-authority";

const badgeVariants = cva(
	// @replit
	// Whitespace-nowrap: Badges should never wrap.
	"whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-[Lato-Regular] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
	" hover-elevate ",
	{
		variants: {
			variant: {
				default:
				// @replit shadow-xs instead of shadow, no hover because we use hover-elevate
				"border-transparent bg-primary text-primary-foreground shadow-xs",
				secondary:
				// @replit no hover because we use hover-elevate
				"border-transparent bg-secondary text-secondary-foreground",
				destructive:
				// @replit shadow-xs instead of shadow, no hover because we use hover-elevate
				"border-transparent bg-destructive text-destructive-foreground shadow-xs",
				// @replit shadow-xs" - use badge outline variable
				outline: "text-foreground border [border-color:var(--badge-outline)]",
				success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
				warning: "border border-amber-200 bg-amber-50 text-amber-700",
				error: "border border-red-200 bg-red-50 text-red-700",
				info: "border border-blue-200 bg-blue-50 text-blue-700",
				global: "border border-violet-200 bg-violet-50 text-violet-700",
				active: "border border-amber-300 bg-amber-50 text-amber-800",
			}
		},
		defaultVariants: {
			variant: "default",
		}
	}
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {};

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={`${badgeVariants({ variant })} ${className}`} {...props} />
	)
}

export { Badge, badgeVariants };
