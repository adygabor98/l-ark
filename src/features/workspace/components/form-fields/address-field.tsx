import type { ReactElement } from "react";

/** Address (multi-field: street, city, state, postal code, country) */
export const AddressFieldRenderer = ({ field, disabled }: any): ReactElement => {
	const value = field.value ?? { street: '', city: '', state: '', postalCode: '', country: '' };
	const update = (key: string, val: string) => field.onChange({ ...value, [key]: val });

	const inputClass = "w-full py-2.5 px-3 rounded-lg text-sm font-[Lato-Regular] text-black/80 bg-white border border-black/10 focus:border-[#FFBF00]/50 outline-none transition-all";

	return (
		<div className="space-y-2">
			<input
				className={inputClass}
				placeholder="Street address"
				value={value.street ?? ''}
				onChange={(e) => update('street', e.target.value)}
				disabled={disabled}
			/>
			<div className="grid grid-cols-2 gap-2">
				<input
					className={inputClass}
					placeholder="City"
					value={value.city ?? ''}
					onChange={(e) => update('city', e.target.value)}
					disabled={disabled}
				/>
				<input
					className={inputClass}
					placeholder="State / Province"
					value={value.state ?? ''}
					onChange={(e) => update('state', e.target.value)}
					disabled={disabled}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<input
					className={inputClass}
					placeholder="Postal code"
					value={value.postalCode ?? ''}
					onChange={(e) => update('postalCode', e.target.value)}
					disabled={disabled}
				/>
				<input
					className={inputClass}
					placeholder="Country"
					value={value.country ?? ''}
					onChange={(e) => update('country', e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
};
