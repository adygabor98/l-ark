import { useCallback, useEffect, useRef, type ReactElement } from "react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { divisions } from "../../data/divisions";

interface OperationFormProps {
	title: string;
	description: string;
	divisionId: string;
	onChange: (field: string, value: string) => void;
}

const OperationForm = ({ title, description, divisionId, onChange }: OperationFormProps): ReactElement => {
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const debouncedChange = useCallback(
		(field: string, value: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => onChange(field, value), 300);
		},
		[onChange]
	);

	useEffect(() => {
		return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
	}, []);

	return (
		<div className="space-y-3">
			<Input
				id="op-title"
				label="Title"
				placeholder="Operation title..."
				defaultValue={title}
				onChange={(e) => debouncedChange("title", e.target.value)}
			/>

			<Textarea
				id="op-description"
				label="Description"
				placeholder="Describe this operation..."
				defaultValue={description}
				onChange={(e) => debouncedChange("description", e.target.value)}
				rows={2}
			/>

			<div className="flex flex-col gap-1.5">
				<label
					htmlFor="op-division"
					className="text-sm font-medium text-text-secondary"
				>
					Division
				</label>
				<div className="relative">
					<select
						id="op-division"
						value={divisionId}
						onChange={(e) => onChange("divisionId", e.target.value)}
						className="h-9 w-full appearance-none rounded-[10px] border border-border bg-white px-3 pr-8 text-sm text-text transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-[3px] focus:ring-primary-100 cursor-pointer"
					>
						<option value="">Select division...</option>
						{divisions.map((d) => (
							<option key={d.id} value={d.id}>
								{d.name}
							</option>
						))}
					</select>
					<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
						<path d="M4 6l4 4 4-4" />
					</svg>
				</div>
			</div>
		</div>
	);
}

export default OperationForm;