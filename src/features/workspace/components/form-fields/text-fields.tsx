import type { ReactElement } from "react";
import { INPUT_BASE } from "./field-styles";

/** Text input */
export const TextFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<input
		className={INPUT_BASE}
		placeholder={placeholder ?? ''}
		{...field}
		value={field.value ?? ''}
		disabled={disabled}
	/>
);

/** Email input */
export const EmailFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<input
		type="email"
		className={INPUT_BASE}
		placeholder={placeholder ?? 'email@example.com'}
		{...field}
		value={field.value ?? ''}
		disabled={disabled}
	/>
);

/** Phone input */
export const PhoneFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<input
		type="tel"
		className={INPUT_BASE}
		placeholder={placeholder ?? '+34 600 000 000'}
		{...field}
		value={field.value ?? ''}
		disabled={disabled}
	/>
);

/** Textarea */
export const TextareaFieldRenderer = ({ field, placeholder, disabled }: any): ReactElement => (
	<textarea
		className={`${INPUT_BASE} resize-y min-h-24`}
		placeholder={placeholder ?? ''}
		{...field}
		value={field.value ?? ''}
		disabled={disabled}
	/>
);

/** Description (read-only rich text) */
export const DescriptionFieldRenderer = ({ fieldDef }: { fieldDef: any }): ReactElement => {
	if (fieldDef.format === 'HTML') {
		return (
			<div
				className="text-sm font-[Lato-Regular] text-black/60 prose prose-sm max-w-none p-3 bg-blue-50/50 border-l-4 border-l-blue-400 rounded-r-lg"
				dangerouslySetInnerHTML={{ __html: fieldDef.placeholder ?? '' }}
			/>
		);
	}
	return (
		<p className="text-sm font-[Lato-Regular] text-black/60 whitespace-pre-wrap p-3 bg-blue-50/50 border-l-4 border-l-blue-400 rounded-r-lg">
			{fieldDef.placeholder ?? ''}
		</p>
	);
};
