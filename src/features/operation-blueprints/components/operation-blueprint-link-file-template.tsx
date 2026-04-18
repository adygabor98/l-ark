import {
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import type {
    StepFileTemplateConfig
} from '@l-ark/types';
import {
    useFileTemplate
} from '../../../server/hooks/useFileTemplate';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '../../../shared/components/dialog';
import {
    FileText,
    Link2,
    Search,
    X
} from 'lucide-react';
import Button from '../../../shared/components/button';

interface PropTypes {
    open: boolean;
    linkedConfigs: StepFileTemplateConfig[];

    onClose: Dispatch<SetStateAction<boolean>>;
    onLink: (templateId: string) => void;
}

const OperationBuilderLinkFileTemplate = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { open, linkedConfigs, onClose, onLink } = props;
    /** File template api utilities */
    const { fileTemplates, retrieveFileTemplates } = useFileTemplate();
    /** State to mange the search */
    const [search, setSearch] = useState<string>("");
    /** State to manage the selected file template id */
    const [selectedId, setSelectedId] = useState<string | null>(null);
    /** Filter: unlinked templates matching search */
    const linkedIds = useMemo(() => new Set(linkedConfigs.map(c => c.templateId)), [linkedConfigs]);
    const filteredTemplates = useMemo(() => {
        return fileTemplates
            .filter(t => !linkedIds.has(String(t.id)))
            .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }, [fileTemplates, linkedIds, search]);
    /** Selected template object */
    const selectedTemplate = selectedId ? fileTemplates.find(t => String(t.id) === selectedId) : null;

    /** Reset state when modal opens */
    useEffect(() => {
        if ( open ) {
            retrieveFileTemplates();
            setSearch("");
        }
    }, [open]);

    /** Handle link action */
    const handleLink = (): void => {
        if (!selectedId ) return;
        onLink(selectedId);
        onClose(false);
        setSelectedId(null);
    };

    return (
       <Dialog open={open} onOpenChange={v => { if (!v) onClose(false); }}>
			<DialogContent className="max-w-md">
				<div className="p-6 space-y-5">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
								<Link2 className="w-3.5 h-3.5 text-amber-700" />
							</div>
							Link File Template
						</DialogTitle>
						<DialogDescription className="text-xs text-black/40 mt-1">
							Search and select a file template to link to this step.
						</DialogDescription>
					</DialogHeader>

					{/* Search + Dropdown */}
					<div className="relative">
						<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest mb-1.5 block">
							File Template
						</label>

						{ selectedTemplate ?
							<div className="flex items-center gap-2 w-full rounded-md border-[0.5px] border-amber-300/60 bg-amber-50 px-3 py-2.5">
								<FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
								<span className="text-sm font-[Lato-Bold] text-black/80 truncate flex-1">
									{ selectedTemplate.title }
								</span>
								<button type="button" onClick={() => { setSelectedId(null); setSearch(""); }}
									className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-amber-200/50 text-black/40 hover:text-black/70 transition-colors cursor-pointer"
								>
									<X className="w-3 h-3" />
								</button>
							</div>
						:
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 pointer-events-none" />
								<input
									type="text"
									value={search}
									placeholder="Search file templates..."
									onChange={e => setSearch(e.target.value)}
									className="w-full rounded-md border-[0.5px] border-gray-300 bg-secondary/50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary/30 transition-all shadow-sm"
								/>
							</div>
						}

						{/* Dropdown */}
						{ !selectedTemplate &&
							<div className="absolute z-50 mt-1 w-full rounded-lg border border-black/8 bg-white shadow-lg max-h-48 overflow-y-auto">
								{ filteredTemplates.length === 0 ?
									<div className="px-3 py-4 text-center">
										<p className="text-xs font-[Lato-Regular] text-black/30 italic">
											{ fileTemplates.length === linkedIds.size ? "All templates are already linked" : "No templates found" }
										</p>
									</div>
								: filteredTemplates.map(template => (
									<button key={template.id} type="button"
										onClick={() => { setSelectedId(String(template.id)); setSearch(""); }}
										className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 hover:bg-black/3 transition-colors cursor-pointer border-b border-black/4 last:border-b-0"
									>
										<FileText className="w-3.5 h-3.5 text-black/40 shrink-0" />
										<div className="min-w-0 flex-1">
											<p className="text-xs font-[Lato-Bold] text-black/70 truncate">
												{ template.title }
											</p>
											{ template.description &&
												<p className="text-[10px] font-[Lato-Regular] text-black/35 truncate mt-0.5">
													{ template.description }
												</p>
											}
										</div>
									</button>
								)) }
							</div>
						}
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-2">
						<Button variant="secondary" size="sm" onClick={() => onClose(false)}>
							Cancel
						</Button>
						<Button variant="primary" size="sm" onClick={handleLink} disabled={!selectedId}>
							<Link2 className="w-3.5 h-3.5" />
							Link
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
    );
}

export default OperationBuilderLinkFileTemplate;