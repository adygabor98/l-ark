import type { ReactElement } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

/** Date picker */
export const DateFieldRenderer = ({ field, disabled }: any): ReactElement => (
	<DatePicker
		className="!w-full !h-[42px] !rounded-lg !border-black/10 !font-[Lato-Regular] !text-sm hover:!border-[#FFBF00]/50 focus:!border-[#FFBF00]/50"
		placeholder="Select date"
		format="DD-MM-YYYY"
		value={field.value ? dayjs(field.value) : null}
		onChange={(date: any) => field.onChange(date ? date.toISOString() : null)}
		disabled={disabled}
	/>
);

/** DateTime picker */
export const DateTimeFieldRenderer = ({ field, disabled }: any): ReactElement => (
	<DatePicker
		className="!w-full !h-[42px] !rounded-lg !border-black/10 !font-[Lato-Regular] !text-sm hover:!border-[#FFBF00]/50 focus:!border-[#FFBF00]/50"
		showTime={{ format: 'HH:mm' }}
		placeholder="Select date & time"
		format="DD-MM-YYYY HH:mm"
		value={field.value ? dayjs(field.value) : null}
		onChange={(date: any) => field.onChange(date ? date.toISOString() : null)}
		disabled={disabled}
	/>
);
