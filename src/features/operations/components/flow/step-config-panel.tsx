import { useCallback, useEffect, useRef, type ReactElement } from "react";
import { Select } from "antd";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import { fileTemplates } from "../../data/file-templates";
import type { Step } from "../../types/operation";

interface StepConfigPanelProps {
	step: Step;
	onUpdate: (updates: Partial<Omit<Step, "id">>) => void;
	onClose: () => void;
	onDelete: () => void;
}

const templateOptions = fileTemplates.map((ft) => ({
	label: `${ft.name} (${ft.type})`,
	value: ft.id,
}));

const StepConfigPanel = ({ step, onUpdate, onClose, onDelete }: StepConfigPanelProps): ReactElement => {
	const panelRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const debouncedUpdate = useCallback(
		(updates: Partial<Omit<Step, "id">>) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => onUpdate(updates), 300);
		},
		[onUpdate]
	);

	useEffect(() => {
		return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<div ref={panelRef} className="flex h-full w-full flex-col bg-white">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5 glass">
				<div className="flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-50">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
						</svg>
					</div>
					<h3 className="text-sm font-semibold text-text">Step Settings</h3>
				</div>
				<button
					onClick={onClose}
					className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-all duration-200 cursor-pointer"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
						<path d="M11 3L3 11M3 3l8 8" />
					</svg>
				</button>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
				<Input
					id="step-title"
					label="Title"
					key={`title-${step.id}`}
					defaultValue={step.title}
					placeholder="Step title..."
					onChange={(e) => debouncedUpdate({ title: e.target.value })}
				/>

				<Textarea
					id="step-description"
					label="Description"
					key={`desc-${step.id}`}
					defaultValue={step.description}
					placeholder="What happens in this step..."
					onChange={(e) => debouncedUpdate({ description: e.target.value })}
				/>

				<div className="relative py-1">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full h-px bg-linear-to-r from-transparent via-border to-transparent" />
					</div>
				</div>

				<div className="space-y-3">
					<Switch
						id="step-blocking"
						checked={step.isBlocking}
						onCheckedChange={(checked) => onUpdate({ isBlocking: checked })}
						label="Blocking"
						description="Next step can't start until this completes"
					/>

					<Switch
						id="step-required"
						checked={step.isRequired}
						onCheckedChange={(checked) => onUpdate({ isRequired: checked })}
						label="Required"
						description="This step cannot be skipped"
					/>
				</div>

				<div className="relative py-1">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full h-px bg-linear-to-r from-transparent via-border to-transparent" />
					</div>
				</div>

				<div>
					<label className="mb-1.5 block text-sm font-medium text-text-secondary">
						File Templates
					</label>
					<Select
						mode="multiple"
						placeholder="Select templates..."
						value={step.fileTemplateIds}
						onChange={(values) => onUpdate({ fileTemplateIds: values })}
						options={templateOptions}
						className="w-full"
						maxTagCount="responsive"
					/>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t border-border/50 px-4 py-3">
				<Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<polyline points="3 6 5 6 21 6" />
						<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
					</svg>
					Delete Step
				</Button>
			</div>
		</div>
	);
}

export default StepConfigPanel;