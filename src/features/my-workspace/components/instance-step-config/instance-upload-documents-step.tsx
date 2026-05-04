import {
    useState,
    type ChangeEvent,
    type DragEvent,
    type KeyboardEvent,
    type ReactElement
} from 'react';
import {
    CheckCircle2,
    ChevronDown,
    Circle,
    Download,
    FileText,
    Link2,
    ListChecks,
    Loader2,
    Paperclip,
    Pencil,
    Share2,
    Upload,
    X
} from 'lucide-react';
import {
    useOperationInstance
} from '../../../../server/hooks/useOperationInstance';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import {
    useDocumentManagement
} from '../../hooks/useDocumentManagement';
import type {
    FetchResult
} from '@apollo/client';
import type {
    ApiResponse
} from '@l-ark/types';
import {
    useToast
} from '../../../../shared/hooks/useToast';
import {
    getResponseMessage
} from '../../../../server/hooks/useApolloWithToast';
import MyWorkspaceOTP from '../my-workspace-otp';
import MyWorkspaceGrantAccess from '../my-workspace-grant-access';

import {
    encodeSharedEntry,
    findEntryForDoc,
    parseCheckedEntry,
    type CheckedDocEntry
} from '../../utils/checked-documents';

interface PropTypes {
    instanceId: number | null;
    isReadOnly: boolean;
}

const InstanceUploadDocumentsStep = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { instanceId, isReadOnly } = props;
    /** My workspace utilities (shared via context) */
    const { instance, selectedBlueprintStep, selectedStepInstance, refreshInstance } = useWorkspaceInstanceContext();
    /** Operation instae api utilities */
    const { updateStepInstance } = useOperationInstance();
    /** Document management utilities */
    const { uploading, fileInputRef, handleFileUpload, handleRenameDocument, handleDeleteDocument } = useDocumentManagement({ instanceId: instanceId, onInstanceUpdate: refreshInstance });
    /** Toast utilities */
    const { onToast } = useToast();
    /** State to manage the grand access visibility for the file sharing */
    const [ grantAccessConfig, setGrantAccessConfig ] = useState<{ docId: number; fileName: string } | null>(null);
    /** State to manage the otp displayment for the visibility and download functionallity of the document */
    const [ otpConfig, setOtpConfig ] = useState<{ docId: number; fileName: string } | null>(null);
    /** Inline rename state */
    const [renamingDocId, setRenamingDocId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renameExt, setRenameExt] = useState('');
    /** Which expected-document row currently has its "Use shared" picker open */
    const [openSharedPickerFor, setOpenSharedPickerFor] = useState<string | null>(null);

    /** Manage to mark a document as uploaded (or remove the satisfaction). Toggles handle both plain and SHARED-encoded entries. */
    const onMarkAsUploaded = async (docName: string, isChecked: boolean): Promise<void> => {
        if ( isReadOnly  ) return;

        const current: string[] = selectedStepInstance?.checkedDocuments ?? [];
        // Strip every entry that targets this docName regardless of provenance encoding.
        const cleared = current.filter(e => parseCheckedEntry(e).docName !== docName);
        const updated = isChecked ? cleared : [...cleared, docName];
        try {
            const response: FetchResult<{ data: ApiResponse }> = await updateStepInstance({ id: selectedStepInstance?.id as number, input: { checkedDocuments: updated } });
            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });

            await refreshInstance();

        } catch ( e: any ) {
            console.error(e);
        }
    }

    /** Satisfy an expected document by linking it to one of the documents shared with this operation. */
    const onSatisfyFromShared = async (docName: string, kind: 'form' | 'doc', id: number): Promise<void> => {
        if ( isReadOnly ) return;

        const current: string[] = selectedStepInstance?.checkedDocuments ?? [];
        const cleared = current.filter(e => parseCheckedEntry(e).docName !== docName);
        const updated = [...cleared, encodeSharedEntry(docName, kind, id)];
        try {
            const response: FetchResult<{ data: ApiResponse }> = await updateStepInstance({ id: selectedStepInstance?.id as number, input: { checkedDocuments: updated } });
            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            setOpenSharedPickerFor(null);
            await refreshInstance();
        } catch ( e: any ) {
            console.error(e);
        }
    }

    /** Flatten all incoming shared rows from the instance's sourceLinks. */
    const incomingShared = (instance?.sourceLinks ?? []).flatMap((l: any) => (l.sharedDocuments ?? []) as any[]);
    const sharedForms = incomingShared.filter((row: any) => row.formInstance != null);
    const sharedDocs = incomingShared.filter((row: any) => row.document != null);
    const hasIncomingShared = sharedForms.length + sharedDocs.length > 0;

    if( !selectedBlueprintStep || !selectedStepInstance ) {
        return <></>;
    }

    /** Handle the drag over event on the file input zone */
    const onDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.currentTarget.classList.add("border-[#FFBF00]/60", "bg-amber-50/30");
    }

    /** Handle the drag leave event on the file input zone */
    const onDragLeave = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-[#FFBF00]/60", "bg-amber-50/30");
    }

    /** Handle the drop event on the file input zone */
    const onDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-[#FFBF00]/60", "bg-amber-50/30");
        if ( e.dataTransfer.files.length > 0 ) {
            handleFileUpload(e.dataTransfer.files, selectedStepInstance.id);
        }
    }

    /** Handle the input file change event from the file input zone */
    const onInputFileChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>): void => {
        if ( e.target.files && e.target.files.length > 0 ) {
            handleFileUpload(e.target.files, selectedStepInstance.id);
        }
    }

    /** Manage the process of renaming */
    const startRename = (doc: { id: number; fileName: string }): void => {
        const lastDot = doc.fileName.lastIndexOf('.');
        const base = lastDot > 0 ? doc.fileName.slice(0, lastDot) : doc.fileName;
        const ext = lastDot > 0 ? doc.fileName.slice(lastDot) : '';

        setRenamingDocId(doc.id);
        setRenameValue(base);
        setRenameExt(ext);
    };

    /** Manage to update the document information */
    const commitRename = async (docId: number): Promise<void> => {
        const newName = renameValue.trim() + renameExt;
        if ( newName && renameValue.trim() ) {
            await handleRenameDocument(docId, newName);
        }
        setRenamingDocId(null);
    };

    /** Manage to cancel the rename of the file */
    const cancelRename = (): void => setRenamingDocId(null);

    /** Automatic rename and cancel of the name of the file */
    const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>, docId: number): void => {
        if (e.key === 'Enter') { e.preventDefault(); commitRename(docId); }
        if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
    };

    /** Resolve a label for an existing SHARED provenance entry so we can show what satisfied a requirement. */
    const labelForProvenance = (parsed: CheckedDocEntry): string | null => {
        if (!parsed.sharedKind || parsed.sharedId == null) return null;
        if (parsed.sharedKind === 'form') {
            const row = sharedForms.find((r: any) => r.formInstance?.id === parsed.sharedId);
            return row?.formInstance?.displayName ?? (row ? `Form #${row.formInstance.id}` : `Form #${parsed.sharedId}`);
        }
        const row = sharedDocs.find((r: any) => r.document?.id === parsed.sharedId);
        return row?.document?.fileName ?? `Document #${parsed.sharedId}`;
    };

    /** Manage to render the expected documents list */
    const renderExpectedDocuments = (): ReactElement => (
        <div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
            <div className="flex items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-[Lato-Bold] text-black/70"> Required Documents </h4>
            </div>
            <div className="space-y-2">
                { (selectedBlueprintStep?.expectedDocuments ?? []).filter(Boolean).map((docName: string) => {
                    const checkedEntries = selectedStepInstance?.checkedDocuments ?? [];
                    const match = findEntryForDoc(checkedEntries, docName);
                    const isChecked = match != null;
                    const provenanceLabel = match ? labelForProvenance(match.parsed) : null;
                    const canToggle = !isReadOnly;
                    const isPickerOpen = openSharedPickerFor === docName;

                    return (
                        <div key={docName} className={`rounded-lg border transition-colors ${
                            isChecked ? "border-emerald-200 bg-emerald-50/40" : "border-black/6 bg-white"
                        }`}>
                            <div className="flex items-center gap-2 p-2">
                                <button disabled={!canToggle} onClick={() => onMarkAsUploaded(docName, isChecked)}
                                    className={`flex items-center gap-2 flex-1 text-left ${canToggle ? "cursor-pointer" : "cursor-default"}`}
                                >
                                    { isChecked ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-black/20 shrink-0" /> }
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-sm font-[Lato-Regular] ${isChecked ? "text-emerald-700 line-through" : "text-black/60"}`}>
                                            { docName }
                                        </span>
                                        { provenanceLabel &&
                                            <p className="text-[10px] text-emerald-600/80 font-[Lato-Regular] mt-0.5 truncate">
                                                via shared: { provenanceLabel }
                                            </p>
                                        }
                                    </div>
                                </button>
                                { canToggle && hasIncomingShared && !isChecked &&
                                    <button onClick={() => setOpenSharedPickerFor(isPickerOpen ? null : docName)}
                                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-[Lato-Bold] border transition-colors cursor-pointer ${
                                            isPickerOpen ? 'border-violet-400 bg-violet-50 text-violet-600' : 'border-violet-200 bg-violet-50/40 text-violet-500 hover:bg-violet-50'
                                        }`}
                                        title="Satisfy this requirement using a document shared with this operation"
                                    >
                                        <Link2 className="w-3 h-3" />
                                        Use shared
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                }
                            </div>
                            { isPickerOpen && hasIncomingShared &&
                                <div className="border-t border-black/6 bg-white max-h-44 overflow-y-auto">
                                    { sharedForms.length > 0 &&
                                        <div className="px-2 py-1 text-[10px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Forms </div>
                                    }
                                    { sharedForms.map((row: any) => {
                                        const label = row.formInstance?.displayName ?? `Form #${row.formInstance?.id}`;
                                        return (
                                            <button key={`f-${row.id}`}
                                                onClick={() => onSatisfyFromShared(docName, 'form', row.formInstance.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-violet-50/40 cursor-pointer border-t border-black/4"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <span className="text-xs font-[Lato-Regular] text-black/70 truncate"> { label } </span>
                                                { row.formInstance?.status &&
                                                    <span className="text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200/50 ml-auto shrink-0">
                                                        { row.formInstance.status }
                                                    </span>
                                                }
                                            </button>
                                        );
                                    })}
                                    { sharedDocs.length > 0 &&
                                        <div className="px-2 py-1 text-[10px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Files </div>
                                    }
                                    { sharedDocs.map((row: any) => (
                                        <button key={`d-${row.id}`}
                                            onClick={() => onSatisfyFromShared(docName, 'doc', row.document.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-violet-50/40 cursor-pointer border-t border-black/4"
                                        >
                                            <Paperclip className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            <span className="text-xs font-[Lato-Regular] text-black/70 truncate"> { row.document?.fileName } </span>
                                        </button>
                                    ))}
                                </div>
                            }
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /** Manage to render the upload documents field form */
    const renderUploadDocuments = (): ReactElement => (
        <div>
            { selectedBlueprintStep.allowDocumentUpload &&
                <div className="h-full p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-[Lato-Bold] text-black/70"> Documents </h4>
                            { uploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> }
                        </div>
                        { selectedStepInstance.documents?.length > 0 &&
                            <span className="text-[10px] font-[Lato-Regular] text-black/35">
                                { selectedStepInstance.documents.length } uploaded
                            </span>
                        }
                    </div>

                    { !isReadOnly &&
                        <div className="h-[calc(100%-50px)] border-2 border-dashed border-black/10 rounded-lg p-5 text-center hover:border-[#FFBF00]/40 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                        >
                            <Upload className="w-5 h-5 text-black/20 mx-auto mb-1.5" />
                            <p className="text-sm text-black/40 font-[Lato-Regular]"> Drop files here or click to upload </p>
                            <p className="text-xs text-black/25 font-[Lato-Regular] mt-0.5"> PDF, DOCX, XLSX, images — up to 10MB each </p>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onInputFileChange} />
                        </div>
                    }
                </div>
            }
        </div>
    )

    /** Manage to render the documents list uploaded by the user */
    const renderDocumentsUploaded = (): ReactElement => (
        <div className="mt-3 space-y-1 w-full">
            { selectedStepInstance.documents.map(doc => {
                const sizeKB = doc.fileSize ? Math.round(doc.fileSize / 1024) : 0;
                const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
                const isRenaming = renamingDocId === doc.id;

                return (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-black/4 group w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                                { isRenaming ? (
                                    <div className="flex items-baseline border-b border-[#FFBF00] pb-0.5">
                                        <input
                                            autoFocus
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onBlur={() => commitRename(doc.id)}
                                            onKeyDown={e => onRenameKeyDown(e, doc.id)}
                                            className="text-xs font-[Lato-Regular] text-black/70 min-w-0 flex-1 outline-none bg-transparent"
                                        />
                                        { renameExt && <span className="text-xs font-[Lato-Regular] text-black/35 shrink-0">{ renameExt }</span> }
                                    </div>
                                ) : (
                                    <span className="text-xs font-[Lato-Regular] text-black/70 truncate block"> { doc.fileName } </span>
                                )}
                                <span className="text-[10px] font-[Lato-Regular] text-black/30"> { sizeLabel } </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setOtpConfig({ docId: doc.id, fileName: doc.fileName })} className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer">
                                <Download className="w-3.5 h-3.5 text-black/40" />
                            </button>
                            <button onClick={() => setGrantAccessConfig({ docId: doc.id, fileName: doc.fileName })} className="p-1 rounded hover:bg-violet-50 transition-colors cursor-pointer">
                                <Share2 className="w-3.5 h-3.5 text-black/40" />
                            </button>
                            { !isReadOnly &&
                                <>
                                    <button onClick={() => startRename(doc)} className="p-1 rounded hover:bg-amber-50 transition-colors cursor-pointer">
                                        <Pencil className="w-3.5 h-3.5 text-black/40" />
                                    </button>
                                    <button onClick={() => handleDeleteDocument(doc.id, doc.fileName)} className="p-1 rounded hover:bg-red-50 transition-colors cursor-pointer">
                                        <X className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </>
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div>
            <div className={`grid ${isReadOnly ? 'grid-cols-1' : 'grid-cols-[0.5fr_1fr]' } gap-2`}>
                { renderExpectedDocuments() }
                { !isReadOnly && renderUploadDocuments() }
            </div>
            { selectedStepInstance.documents?.length > 0 && renderDocumentsUploaded() }
            { otpConfig &&
                <MyWorkspaceOTP {...otpConfig} onClose={() => setOtpConfig(null)} />
            }
			{ grantAccessConfig && <MyWorkspaceGrantAccess {...grantAccessConfig} onClose={() => setGrantAccessConfig(null)} /> }
        </div>
    );
}

export default InstanceUploadDocumentsStep;
