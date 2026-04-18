import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	type ReactElement
} from "react";
import {
	X,
	Save,
	SendHorizontal,
	Loader2,
	FileText,
	AlertCircle,
	ChevronRight
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { FormInstanceStatus } from "@l-ark/types";
import Button from "../../../shared/components/button";
import { useFileTemplate } from "../../../server/hooks/useFileTemplate";
import { useToast } from "../../../shared/hooks/useToast";
import { FormField } from "./form-fields/field-registry";
import type { FetchResult } from "@apollo/client";

interface PropTypes {
	templateId: number;
	stepInstanceId: number;
	formInstanceId?: number;
	readOnly?: boolean;
	onClose: () => void;
	onSaved?: () => void;
}

const FillFormModal = (props: PropTypes): ReactElement => {
	const { templateId, stepInstanceId, formInstanceId, readOnly, onClose, onSaved } = props;

	const { retrieveFileTemplateById, fileTemplate, createFormInstance, saveFormInstance, submitFormInstance, retrieveFormInstance } = useFileTemplate();
	const { onToast } = useToast();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [currentFormInstanceId, setCurrentFormInstanceId] = useState<number | null>(formInstanceId ?? null);
	const [formStatus, setFormStatus] = useState<string | null>(null);
	const [activeSectionIdx, setActiveSectionIdx] = useState(0);

	const isAlreadySubmitted = formStatus === FormInstanceStatus.SUBMITTED || formStatus === FormInstanceStatus.APPROVED;

	const { control, handleSubmit, reset } = useForm({ mode: 'onBlur' });

	// Load template detail + existing form instance if editing
	useEffect(() => {
		const initialize = async () => {
			await retrieveFileTemplateById({ id: templateId });

			if (formInstanceId) {
				const res: FetchResult<{ data: any }> = await retrieveFormInstance({ id: formInstanceId });
				if (res.data?.data) {
					const values: Record<string, any> = {};
					for (const fv of res.data.data.fieldValues) {
						values[`field_${fv.fieldId}`] = fv.value;
					}
					reset(values);
					setFormStatus(res.data.data.status ?? null);
				}
			}
			setLoading(false);
		};
		initialize();
	}, [templateId, formInstanceId]);

	// Get the latest version with sections and fields
	const latestVersion = useMemo(() => {
		if (!fileTemplate?.versions) return null;
		return fileTemplate.versions.find((v: any) => v.isLatest) ?? fileTemplate.versions[0] ?? null;
	}, [fileTemplate]);

	const sections = useMemo(() => {
		if (!latestVersion?.sections) return [];
		return [...latestVersion.sections].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
	}, [latestVersion]);

	const activeSection = sections[activeSectionIdx] ?? null;

	const sortedFields = useMemo(() => {
		if (!activeSection?.fields) return [];
		return [...activeSection.fields].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
	}, [activeSection]);

	const formValues = useWatch({ control });

	/** Count filled fields per section for progress */
	const sectionProgress = useCallback((section: any): { filled: number; total: number } => {
		const fields = (section.fields ?? []).filter((f: any) => f.type !== 'DESCRIPTION');
		const filled = fields.filter((f: any) => {
			const val = formValues[`field_${f.id}`];
			return val !== undefined && val !== null && val !== '';
		}).length;
		return { filled, total: fields.length };
	}, [formValues]);

	/** Collect field values from the form */
	const collectFieldValues = (data: Record<string, any>) => {
		return Object.entries(data)
			.filter(([key]) => key.startsWith('field_'))
			.map(([key, value]) => ({
				fieldId: key.replace('field_', ''),
				value
			}));
	};

	/** Save as draft */
	const handleSave = async (data: Record<string, any>) => {
		setSaving(true);
		try {
			const fieldValues = collectFieldValues(data);

			if (!currentFormInstanceId) {
				const res: any = await createFormInstance({
					input: {
						templateId: String(templateId),
						stepInstanceId: String(stepInstanceId),
						fieldValues
					}
				});

				if (res.data?.data?.data) {
					setCurrentFormInstanceId(res.data.data.data);
				}
			} else {
				await saveFormInstance({
					id: currentFormInstanceId,
					input: { fieldValues }
				});
			}

			onToast({ message: 'Form saved as draft', type: 'success' });
			onSaved?.();
			onClose();
		} catch {
			onToast({ message: 'Failed to save form', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	/** Update an already-submitted form (save field values only, no status change) */
	const handleUpdate = async (data: Record<string, any>) => {
		if (!currentFormInstanceId) return;
		setSaving(true);
		try {
			const fieldValues = collectFieldValues(data);
			await saveFormInstance({
				id: currentFormInstanceId,
				input: { fieldValues }
			});
			onToast({ message: 'Form updated successfully', type: 'success' });
			onSaved?.();
			onClose();
		} catch {
			onToast({ message: 'Failed to update form', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	/** Submit the form */
	const handleFormSubmit = async (data: Record<string, any>) => {
		setSaving(true);
		try {
			const fieldValues = collectFieldValues(data);
			let idToSubmit = currentFormInstanceId;

			if (!idToSubmit) {
				const res: any = await createFormInstance({
					input: {
						templateId: String(templateId),
						stepInstanceId: String(stepInstanceId),
						fieldValues
					}
				});

				if (res.data?.data?.data) {
					idToSubmit = res.data.data.data;
					setCurrentFormInstanceId(idToSubmit);
				}
			} else {
				await saveFormInstance({
					id: idToSubmit,
					input: { fieldValues }
				});
			}

			if (idToSubmit) {
				await submitFormInstance({ id: idToSubmit });
				onToast({ message: 'Form submitted successfully', type: 'success' });
				onSaved?.();
				onClose();
			}
		} catch {
			onToast({ message: 'Failed to submit form', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Overlay */}
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			{/* Modal */}
			<div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-black/6 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
							<FileText className="w-4 h-4 text-amber-600" />
						</div>
						<div>
							<h2 className="text-md font-[Lato-Bold] text-black/80">
								{fileTemplate?.title ?? 'Fill Form'}
							</h2>
							<p className="text-[11px] font-[Lato-Regular] text-black/40">
								{readOnly ? 'View submitted form' : 'Fill out the required fields and submit'}
							</p>
						</div>
					</div>
					<Button variant="icon" onClick={onClose}>
						<X className="w-4 h-4" />
					</Button>
				</div>

				{/* Body — 2-panel layout */}
				<div className="flex-1 flex overflow-hidden">
					{loading ? (
						<div className="flex-1 flex items-center justify-center">
							<div className="flex flex-col items-center gap-2">
								<Loader2 className="w-6 h-6 animate-spin text-amber-500" />
								<span className="text-sm font-[Lato-Regular] text-black/40">Loading template...</span>
							</div>
						</div>
					) : sections.length === 0 ? (
						<div className="flex-1 flex items-center justify-center">
							<div className="flex flex-col items-center text-center">
								<AlertCircle className="w-8 h-8 text-black/20 mb-2" />
								<p className="text-sm font-[Lato-Regular] text-black/40">No sections found for this template.</p>
							</div>
						</div>
					) : (
						<>
							{/* Left Panel — Sections navigation */}
							<div className="w-60 shrink-0 border-r border-black/6 flex flex-col bg-[#FAFAFA]">
								<div className="px-4 py-3 border-b border-black/6">
									<h3 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest">Sections</h3>
								</div>

								<div className="flex-1 overflow-y-auto p-2">
									<div className="space-y-1">
										{sections.map((section: any, idx: number) => {
											const isActive = idx === activeSectionIdx;
											const progress = sectionProgress(section);

											return (
												<button
													key={section.id}
													onClick={() => setActiveSectionIdx(idx)}
													className={`w-full text-left rounded-xl p-2.5 transition-all duration-200 cursor-pointer group ${
														isActive
															? 'bg-amber-50/80 ring-1 ring-amber-300/60 shadow-sm'
															: 'hover:bg-white hover:ring-1 hover:ring-black/4'
													}`}
												>
													<div className="flex items-center gap-2">
														<span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-[Lato-Bold] transition-all ${
															isActive ? 'bg-[#FFBF00] text-neutral-800 shadow-sm' : 'bg-black/5 text-black/40'
														}`}>
															{idx + 1}
														</span>
														<span className={`text-[13px] font-[Lato-Bold] truncate transition-colors ${
															isActive ? 'text-black/90' : 'text-black/60'
														}`}>
															{section.title || 'Untitled'}
														</span>
													</div>

													{section.description && (
														<p className="mt-0.5 ml-7 text-[10px] font-[Lato-Regular] text-black/30 truncate">
															{section.description}
														</p>
													)}

													<div className="mt-1.5 ml-7 flex items-center gap-1.5">
														<span className="text-[9px] font-[Lato-Regular] text-black/30">
															{progress.total} {progress.total === 1 ? 'field' : 'fields'}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>

								{/* Section navigation */}
								<div className="px-3 py-2.5 border-t border-black/6 flex items-center justify-between">
									<Button
										variant="ghost"
										size="sm"
										disabled={activeSectionIdx === 0}
										onClick={() => setActiveSectionIdx((p) => Math.max(0, p - 1))}
									>
										Previous
									</Button>
									<span className="text-[10px] font-[Lato-Bold] text-black/30">
										{activeSectionIdx + 1} / {sections.length}
									</span>
									<Button
										variant="ghost"
										size="sm"
										disabled={activeSectionIdx === sections.length - 1}
										onClick={() => setActiveSectionIdx((p) => Math.min(sections.length - 1, p + 1))}
									>
										Next
									</Button>
								</div>
							</div>

							{/* Right Panel — Fields */}
							<div className="flex-1 overflow-y-auto">
								{activeSection && (
									<div className="p-6">
										{/* Section header */}
										<div className="mb-5">
											<div className="flex items-center gap-2 mb-1">
												<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFBF00] text-neutral-800 text-xs font-[Lato-Bold] shadow-sm">
													{activeSectionIdx + 1}
												</span>
												<h3 className="text-lg font-[Lato-Bold] text-black/80">{activeSection.title}</h3>
											</div>
											{activeSection.description && (
												<p className="text-sm font-[Lato-Regular] text-black/40 ml-8">{activeSection.description}</p>
											)}
										</div>

										{/* Fields grid */}
										<div className="grid grid-cols-12 gap-x-4 gap-y-5">
											{sortedFields.map((fieldDef: any) => (
												<FormField
													key={fieldDef.id}
													fieldDef={fieldDef}
													control={control}
													disabled={readOnly}
												/>
											))}
										</div>

										{/* Section navigation at bottom */}
										{sections.length > 1 && (
											<div className="mt-8 flex items-center justify-between pt-5 border-t border-black/6">
												{activeSectionIdx > 0 ? (
													<Button variant="ghost" size="sm" onClick={() => setActiveSectionIdx((p) => p - 1)}>
														<ChevronRight className="w-4 h-4 rotate-180" />
														{sections[activeSectionIdx - 1]?.title ?? 'Previous'}
													</Button>
												) : <div />}

												{activeSectionIdx < sections.length - 1 && (
													<Button variant="secondary" size="sm" onClick={() => setActiveSectionIdx((p) => p + 1)}>
														{sections[activeSectionIdx + 1]?.title ?? 'Next'}
														<ChevronRight className="w-4 h-4" />
													</Button>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				{!readOnly && !loading && sections.length > 0 && (
					<div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-black/6 bg-[#F8F9FA] shrink-0">
						<Button variant="ghost" onClick={onClose} disabled={saving}>
							Cancel
						</Button>
						{ isAlreadySubmitted ? (
							<Button variant="primary" onClick={handleSubmit(handleUpdate)} disabled={saving}>
								{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
								Update information
							</Button>
						) : formStatus === FormInstanceStatus.DRAFT ? (
							<>
								<Button variant="ghost" onClick={handleSubmit(handleSave)} disabled={saving}>
									{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
									Save Draft
								</Button>
								<Button variant="primary" onClick={handleSubmit(handleFormSubmit)} disabled={saving}>
									{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
									Submit
								</Button>
							</>
						) : (
							<Button variant="ghost" onClick={handleSubmit(handleSave)} disabled={saving}>
								{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
								Save Draft
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default FillFormModal;
