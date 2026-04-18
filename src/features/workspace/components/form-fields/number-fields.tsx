import type { ReactElement } from "react";
import { INPUT_BASE } from "./field-styles";

/** Number input */
export const NumberFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<input
		type="number"
		className={INPUT_BASE}
		placeholder={placeholder ?? '0'}
		value={field.value ?? ''}
		onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
		disabled={disabled}
	/>
);

/** Currency input */
export const CurrencyFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<div className="relative">
		<input
			type="number"
			step="0.01"
			className={`${INPUT_BASE} pr-8`}
			placeholder={placeholder ?? '0.00'}
			value={field.value ?? ''}
			onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
			disabled={disabled}
		/>
		<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-[Lato-Bold] text-black/30 pointer-events-none">€</span>
	</div>
);

/** Percentage input */
export const PercentageFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<div className="relative">
		<input
			type="number"
			min={0}
			max={100}
			className={`${INPUT_BASE} pr-8`}
			placeholder={placeholder ?? '0'}
			value={field.value ?? ''}
			onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
			disabled={disabled}
		/>
		<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-[Lato-Bold] text-black/30 pointer-events-none">%</span>
	</div>
);
