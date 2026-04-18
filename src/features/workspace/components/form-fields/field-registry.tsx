import type { ReactElement } from "react";
import { Controller } from "react-hook-form";
import { FIELD_WIDTH_MAP } from "../../../../models/template.models";
import { TextFieldRenderer, EmailFieldRenderer, PhoneFieldRenderer, TextareaFieldRenderer, DescriptionFieldRenderer } from "./text-fields";
import { NumberFieldRenderer, CurrencyFieldRenderer, PercentageFieldRenderer } from "./number-fields";
import { DateFieldRenderer, DateTimeFieldRenderer } from "./date-fields";
import { BooleanFieldRenderer, CheckboxGroupRenderer, RadioGroupRenderer, SelectFieldRenderer } from "./selection-fields";
import { AddressFieldRenderer } from "./address-field";
import { FileFieldRenderer } from "./file-field";
import { SignatureFieldRenderer } from "./signature-field";
import { TableFieldRenderer } from "./table-field";

/** Route field type to the right renderer */
const renderFieldByType = (fieldDef: any, field: any, disabled?: boolean): ReactElement => {
	switch (fieldDef.type) {
		case 'TEXT':
			return <TextFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'EMAIL':
			return <EmailFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'PHONE':
			return <PhoneFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'TEXTAREA':
			return <TextareaFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'NUMBER':
			return <NumberFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'CURRENCY':
			return <CurrencyFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'PERCENTAGE':
			return <PercentageFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'DATE':
			return <DateFieldRenderer field={field} disabled={disabled} />;
		case 'DATE_TIME':
			return <DateTimeFieldRenderer field={field} disabled={disabled} />;
		case 'BOOLEAN':
			return <BooleanFieldRenderer field={field} disabled={disabled} />;
		case 'CHECKBOX':
			return <CheckboxGroupRenderer field={field} options={fieldDef.options} disabled={disabled} />;
		case 'RADIO_GROUP':
			return <RadioGroupRenderer field={field} options={fieldDef.options} disabled={disabled} />;
		case 'SELECT':
			return <SelectFieldRenderer field={field} options={fieldDef.options} multiple={fieldDef.multiple} placeholder={fieldDef.placeholder} disabled={disabled} />;
		case 'ADDRESS':
			return <AddressFieldRenderer field={field} disabled={disabled} />;
		case 'TABLE':
			return <TableFieldRenderer field={field} columns={fieldDef.columns} disabled={disabled} />;
		case 'FILE':
			return <FileFieldRenderer field={field} requiredDocuments={fieldDef.requiredDocuments} disabled={disabled} />;
		case 'SIGNATURE':
			return <SignatureFieldRenderer field={field} disabled={disabled} />;
		default:
			return <TextFieldRenderer field={field} placeholder={fieldDef.placeholder} disabled={disabled} />;
	}
};

/** Form field wrapper — handles label, help text, validation, and width */
export const FormField = ({ fieldDef, control, disabled }: { fieldDef: any; control: any; disabled?: boolean }): ReactElement => {
	const name = `field_${fieldDef.id}`;

	// Description is read-only — no form control needed
	if (fieldDef.type === 'DESCRIPTION') {
		return (
			<div className={FIELD_WIDTH_MAP[fieldDef.width as keyof typeof FIELD_WIDTH_MAP] ?? 'col-span-12'}>
				<DescriptionFieldRenderer fieldDef={fieldDef} />
			</div>
		);
	}

	return (
		<div className={FIELD_WIDTH_MAP[fieldDef.width as keyof typeof FIELD_WIDTH_MAP] ?? 'col-span-12'}>
			{/* Label */}
			<label className="flex items-center gap-1 mb-1.5">
				<span className="text-[11px] font-[Lato-Bold] text-black/50 uppercase tracking-wider">
					{fieldDef.label}
				</span>
				{fieldDef.required && <span className="text-red-400 text-xs">*</span>}
			</label>

			{/* Help text */}
			{fieldDef.helpText && (
				<p className="text-[10px] font-[Lato-Regular] text-black/30 mb-1.5">{fieldDef.helpText}</p>
			)}

			{/* Field renderer */}
			<Controller
				name={name}
				control={control}
				rules={{ required: fieldDef.required ? 'This field is required' : false }}
				render={({ field, fieldState }) => (
					<div>
						{renderFieldByType(fieldDef, field, disabled)}
						{fieldState.error && (
							<p className="text-red-400 text-xs mt-1 font-[Lato-Regular]">{fieldState.error.message}</p>
						)}
					</div>
				)}
			/>
		</div>
	);
};
