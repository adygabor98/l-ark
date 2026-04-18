import { useRef, useState, type ReactElement } from "react";
import { CheckSquare, FileText, Square, Trash2, Upload } from "lucide-react";

/** File upload field */
export const FileFieldRenderer = ({ field, requiredDocuments, disabled }: { field: any; requiredDocuments?: string[]; disabled?: boolean }): ReactElement => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => field.onChange({ name: file.name, size: file.size, type: file.type, data: reader.result });
		reader.readAsDataURL(file);
	};

	const toggleDoc = (idx: number) => {
		setCheckedDocs(prev => ({ ...prev, [idx]: !prev[idx] }));
	};

	const hasDocs = requiredDocuments && requiredDocuments.length > 0;

	const uploadArea = field.value ? (
		<div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-black/8">
			<FileText className="w-4 h-4 text-blue-400 shrink-0" />
			<span className="text-sm font-[Lato-Regular] text-black/70 truncate flex-1">{field.value.name}</span>
			{!disabled && (
				<button type="button" onClick={() => field.onChange(null)} className="text-black/30 hover:text-red-500 transition-colors cursor-pointer">
					<Trash2 className="w-3.5 h-3.5" />
				</button>
			)}
		</div>
	) : (
		<button
			type="button"
			onClick={() => !disabled && inputRef.current?.click()}
			className={`w-full p-6 border-2 border-dashed border-black/10 rounded-xl text-center transition-colors ${disabled ? '' : 'hover:border-[#FFBF00]/40 cursor-pointer'}`}
		>
			<Upload className="w-6 h-6 text-black/20 mx-auto mb-1" />
			<p className="text-sm font-[Lato-Regular] text-black/40">Click to upload</p>
			<p className="text-xs font-[Lato-Regular] text-black/25 mt-0.5">PDF, DOCX, XLSX up to 10MB</p>
		</button>
	);

	return (
		<div>
			{ hasDocs ? (
				<div className="flex gap-3">
					{/* Left column — required documents checklist */}
					<div className="w-2/5 shrink-0 space-y-1.5">
						<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-widest mb-2"> Required </p>
						{ requiredDocuments!.map((docName, idx) => (
							<button
								key={idx}
								type="button"
								onClick={() => toggleDoc(idx)}
								className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-black/6 bg-[#F8F9FA] hover:bg-black/3 transition-colors text-left group"
							>
								{ checkedDocs[idx]
									? <CheckSquare className="w-4 h-4 text-[#FFBF00] shrink-0" />
									: <Square className="w-4 h-4 text-black/20 shrink-0 group-hover:text-black/35 transition-colors" />
								}
								<span className={`text-xs font-[Lato-Regular] truncate leading-tight transition-colors ${checkedDocs[idx] ? 'text-black/50 line-through' : 'text-black/65'}`}>
									{ docName }
								</span>
							</button>
						))}
					</div>

					{/* Right column — file input (wider) */}
					<div className="flex-1 min-w-0">
						{ uploadArea }
					</div>
				</div>
			) : uploadArea }

			<input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
		</div>
	);
};
