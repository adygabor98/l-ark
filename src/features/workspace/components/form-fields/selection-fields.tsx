import type { ReactElement } from "react";
import { Radio, Checkbox, Switch, Select as AntSelect } from "antd";

/** Boolean switch */
export const BooleanFieldRenderer = ({ field, disabled }: any): ReactElement => (
	<div className="flex items-center h-10">
		<Switch
			checked={field.value ?? false}
			onChange={(val: boolean) => field.onChange(val)}
			disabled={disabled}
		/>
		<span className="ml-2 text-sm font-[Lato-Regular] text-black/50">
			{field.value ? 'Yes' : 'No'}
		</span>
	</div>
);

/** Checkbox group */
export const CheckboxGroupRenderer = ({ field, options, disabled }: any): ReactElement => (
	<Checkbox.Group
		className="!flex !flex-wrap !gap-2"
		value={field.value ?? []}
		onChange={(val: any) => field.onChange(val)}
		disabled={disabled}
	>
		{(options ?? []).map((opt: any) => (
			<Checkbox key={opt.value} value={opt.value} className="!font-[Lato-Regular] !text-sm">
				{opt.label}
			</Checkbox>
		))}
	</Checkbox.Group>
);

/** Radio group */
export const RadioGroupRenderer = ({ field, options, disabled }: any): ReactElement => (
	<Radio.Group
		className="!flex !flex-wrap !gap-2"
		value={field.value ?? undefined}
		onChange={(e: any) => field.onChange(e.target.value)}
		disabled={disabled}
	>
		{(options ?? []).map((opt: any) => (
			<Radio key={opt.value} value={opt.value} className="!font-[Lato-Regular] !text-sm">
				{opt.label}
			</Radio>
		))}
	</Radio.Group>
);

/** Select dropdown */
export const SelectFieldRenderer = ({ field, options, multiple, placeholder, disabled }: any): ReactElement => (
	<AntSelect
		className="!w-full !h-10 !rounded-lg !font-[Lato-Regular] !text-sm"
		mode={multiple ? 'multiple' : undefined}
		placeholder={placeholder ?? 'Select...'}
		options={(options ?? []).map((opt: any) => ({ label: opt.label, value: opt.value }))}
		value={field.value ?? undefined}
		onChange={(val: any) => field.onChange(val)}
		disabled={disabled}
		allowClear
		virtual={false}
		getPopupContainer={(trigger) => trigger.parentElement || document.body}
	/>
);
