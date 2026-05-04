import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
	color?: 'primary' | 'blue' | 'purple' | 'green';
}

const colorClasses = {
	primary: 'data-[state=checked]:bg-primary',
	blue: 'data-[state=checked]:bg-blue-600',
	purple: 'data-[state=checked]:bg-purple-600',
	green: 'data-[state=checked]:bg-green-600',
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(({ className, color = 'primary', ...props }, ref) => (
  	<SwitchPrimitives.Root
    	className={`peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors
			focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
			disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-input ${colorClasses[color]} ${className ?? ''}`}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb className={`pointer-events-none block h-4 w-4 rounded-full bg-muted-foreground shadow-lg
			ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-primary-foreground`} />
	</SwitchPrimitives.Root>
));

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
