import {
    useState,
    type ReactElement
} from 'react';
import {
    Download,
    Eye,
    FileText,
    Paperclip,
    Plus,
    Share2,
    X
} from 'lucide-react';
import {
    type ApiResponse
} from '@l-ark/types';
import {
    useOperationInstance
} from '../../../server/hooks/useOperationInstance';
import {
    useToast
} from '../../../shared/hooks/useToast';
import {
    useWorkspaceInstanceContext
} from '../context/workspace-instance.context';
import type {
    FetchResult
} from '@apollo/client';
import LaunchOperationDialog from './launch-operation-dialog/launch-operation-dialog';
import ExportFileInstance from './instance-step-config/export-file-template';
import MyWorkspaceOTP from './my-workspace-otp';
import Button from '../../../shared/components/button';

export interface SharedDocumentRow {
    id: number;
    instanceLinkId: number;
    formInstanceId?: number | null;
    documentId?: number | null;
    createdAt?: string;
    formInstance?: {
        id: number;
        displayName?: string | null;
        status?: string;
        templateVersionId?: number;
        templateVersion?: {
            templateId?: number;
            template?: { id?: number; title?: string } | null;
        } | null;
        stepInstanceForms?: { stepInstance?: { instanceId?: number } | null }[] | null;
    } | null;
    document?: {
        id: number;
        fileName: string;
        fileSize: number;
        mimeType: string;
        stepInstance?: { instanceId?: number } | null;
    } | null;
}

/** Resolve which OperationInstance the underlying form/document originally belongs to. */
export const getOriginInstanceId = (row: SharedDocumentRow): number | undefined => {
    if (row.document) return row.document.stepInstance?.instanceId;
    if (row.formInstance) return row.formInstance.stepInstanceForms?.[0]?.stepInstance?.instanceId;
    return undefined;
};

interface SharedDocumentsPanelProps {
    /** Link this panel manages — i.e. the InstanceLink that connects two operations. */
    instanceLinkId: number;
    /** Existing shared rows (from the link's `sharedDocuments` field). */
    sharedDocuments: SharedDocumentRow[];
    /** Display label for the other operation. */
    counterpartTitle?: string;
    /**
     * "owner" mode (the source operation managing what it shared) shows add/revoke controls.
     * "viewer" mode (the target seeing what was shared with it) is read-only.
     */
    mode: 'owner' | 'viewer';
}

const formatBytes = (n: number): string => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const SharedDocumentsPanel = (props: SharedDocumentsPanelProps): ReactElement => {
    const { instanceLinkId, sharedDocuments, counterpartTitle, mode } = props;
    const { manageSharedDocuments } = useOperationInstance();
    const { onToast, onConfirmationToast } = useToast();
    const { instance, refreshInstance } = useWorkspaceInstanceContext();
    /**
     * Filter rows to the side that's relevant for the current view:
     * - "owner": rows whose underlying content belongs to *this* operation (what we sent).
     * - "viewer": rows whose underlying content belongs to the *other* operation (what we received).
     * Rows missing origin metadata fall through unchanged so older data stays visible.
     */
    const visibleRows = sharedDocuments.filter(row => {
        const origin = getOriginInstanceId(row);
        if (instance?.id == null) return true;
        if (origin == null) return mode === 'viewer';
        return mode === 'owner' ? origin === instance.id : origin !== instance.id;
    });
    const [pickerOpen, setPickerOpen] = useState(false);
    /** Controls the form-instance preview/export modal (reuses ExportFileInstance) */
    const [exportConfig, setExportConfig] = useState<{ templateId: number; formInstanceId: number; templateName?: string } | null>(null);
    /** Controls the OTP-protected file download flow (reuses MyWorkspaceOTP) */
    const [otpConfig, setOtpConfig] = useState<{ docId: number; fileName: string } | null>(null);

    const handleAddSubmit = async (payload: { sharedFormInstanceIds: number[]; sharedDocumentIds: number[] }): Promise<void> => {
        const res: FetchResult<{ data: ApiResponse }> = await manageSharedDocuments({
            input: {
                instanceLinkId,
                addFormInstanceIds: payload.sharedFormInstanceIds,
                addDocumentIds: payload.sharedDocumentIds,
            }
        });
        onToast({ message: res.data?.data?.message ?? '', type: res.data?.data?.success ? 'success' : 'error' });
        if ( res.data?.data?.success ) {
            setPickerOpen(false);
            await refreshInstance();
        }
    };

    const handleRevoke = async (rowId: number): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: 'Stop sharing this document?',
            description: 'The other operation will no longer see this item.',
            actionText: 'Revoke',
            cancelText: 'Cancel',
            actionColor: 'error'
        });
        if ( !confirmed ) return;

        const res: FetchResult<{ data: ApiResponse }> = await manageSharedDocuments({
            input: { instanceLinkId, revokeIds: [rowId] }
        });
        onToast({ message: res.data?.data?.message ?? '', type: res.data?.data?.success ? 'success' : 'error' });
        if ( res.data?.data?.success ) await refreshInstance();
    };

    return (
        <div className="rounded-xl border border-black/6 bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-black/4">
                <div className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-[Lato-Bold] text-black/70">
                        { mode === 'owner' ? 'Documents shared' : 'Documents shared with this operation' }
                        { counterpartTitle && <span className="text-black/40 font-[Lato-Regular] ml-1"> — { counterpartTitle } </span> }
                    </span>
                </div>
                { mode === 'owner' &&
                    <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
                        <Plus className="w-3 h-3" /> Add
                    </Button>
                }
            </div>

            { visibleRows.length === 0 ?
                <p className="text-[11px] text-black/30 font-[Lato-Regular] text-center py-3">
                    { mode === 'owner' ? 'Nothing shared yet.' : 'No documents have been shared.' }
                </p>
            :
                <div className="divide-y divide-black/4">
                    { visibleRows.map(row => {
                        const isForm = row.formInstance != null;
                        const label = isForm
                            ? (row.formInstance?.displayName ?? `Form #${row.formInstance?.id ?? row.formInstanceId}`)
                            : (row.document?.fileName ?? `Document #${row.documentId}`);
                        const sub = isForm
                            ? row.formInstance?.status
                            : row.document ? formatBytes(row.document.fileSize) : '';

                        const formTemplateId = row.formInstance?.templateVersion?.templateId
                            ?? row.formInstance?.templateVersion?.template?.id;
                        const formTemplateName = row.formInstance?.templateVersion?.template?.title;
                        const canPreviewForm = isForm && formTemplateId != null && row.formInstance?.id != null;
                        const canDownloadDoc = !isForm && row.document?.id != null;

                        return (
                            <div key={row.id} className="flex items-center justify-between px-3 py-2 group">
                                <div className="flex items-center gap-2 min-w-0">
                                    { isForm
                                        ? <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        : <Paperclip className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    }
                                    <span className="text-xs font-[Lato-Regular] text-black/70 truncate"> { label } </span>
                                    { sub &&
                                        <span className="text-[10px] text-black/30 font-[Lato-Regular] shrink-0"> { sub } </span>
                                    }
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                    { canPreviewForm &&
                                        <button onClick={() => setExportConfig({
                                                templateId: formTemplateId!,
                                                formInstanceId: row.formInstance!.id,
                                                templateName: formTemplateName ?? label,
                                            })}
                                            className="w-6 h-6 rounded flex items-center justify-center text-black/40 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                                            title="Preview / export"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    }
                                    { canDownloadDoc &&
                                        <button onClick={() => setOtpConfig({ docId: row.document!.id, fileName: row.document!.fileName })}
                                            className="w-6 h-6 rounded flex items-center justify-center text-black/40 hover:text-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer"
                                            title="Download"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    }
                                    { mode === 'owner' &&
                                        <button onClick={() => handleRevoke(row.id)}
                                            className="w-6 h-6 rounded flex items-center justify-center text-black/30 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                            title="Stop sharing"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            }

            { pickerOpen &&
                <LaunchOperationDialog
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    headerTitle="Share more documents"
                    headerSubtitle="Pick additional submitted forms and uploaded files to share."
                    submitLabel="Share"
                    fixedBlueprint={{ id: -1, title: 'Share more documents' }}
                    onSubmit={async (payload) => {
                        // We don't need title/description/blueprint here — only the shared lists.
                        await handleAddSubmit({
                            sharedFormInstanceIds: payload.sharedFormInstanceIds,
                            sharedDocumentIds: payload.sharedDocumentIds,
                        });
                    }}
                />
            }

            { exportConfig &&
                <ExportFileInstance {...exportConfig} onClose={setExportConfig} />
            }
            { otpConfig &&
                <MyWorkspaceOTP {...otpConfig} onClose={() => setOtpConfig(null)} />
            }
        </div>
    );
};

export default SharedDocumentsPanel;
