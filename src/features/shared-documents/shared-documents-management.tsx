import {
    useEffect,
    useMemo,
    useState,
    type ReactElement
} from 'react';
import {
    Download,
    FileText,
    Inbox,
    Share2,
    User as UserIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDocumentGrants } from '../../server/hooks/useDocumentGrants';
import MyWorkspaceOTP from '../my-workspace/components/my-workspace-otp';

const formatBytes = (n: number): string => {
    if (!n || n < 1024) return `${n ?? 0} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const formatPersonName = (p?: { firstName?: string | null; lastName?: string | null } | null): string => {
    if (!p) return '—';
    return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—';
};

const SharedDocumentsManagement = (): ReactElement => {
    const { t } = useTranslation();
    const { sharedDocuments, retrieveSharedDocuments } = useDocumentGrants();

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    /** Controls the OTP-protected file download flow (reuses MyWorkspaceOTP) */
    const [otpConfig, setOtpConfig] = useState<{ docId: number; fileName: string } | null>(null);

    useEffect(() => {
        retrieveSharedDocuments();
    }, []);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sharedDocuments.slice(start, start + pageSize);
    }, [sharedDocuments, currentPage, pageSize]);

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-violet-500" strokeWidth={1.75} />
                        <h1 className="text-xl font-[Lato-Bold] text-black truncate">
                            { t('titles.shared-with-me') }
                        </h1>
                        { sharedDocuments.length > 0 &&
                            <span className="text-[11px] font-[Lato-Bold] text-black/45 bg-black/5 rounded-full px-2 py-0.5">
                                { sharedDocuments.length }
                            </span>
                        }
                    </div>
                    <p className="text-sm font-[Lato-Regular] text-black/45 mt-1">
                        Documents that other users have explicitly shared with you.
                    </p>
                </div>
            </div>

            <div className="h-full flex-1 flex flex-col overflow-y-auto relative mt-5">
                { sharedDocuments.length > 0 ?
                    <>
                        <div className="bg-white rounded-2xl border border-black/6 overflow-hidden flex-1">
                            {/* Table header */}
                            <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_64px] gap-4 px-6 py-3.5 bg-black/2 border-b border-black/6">
                                <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Document </span>
                                <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Operation </span>
                                <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Shared by </span>
                                <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Shared on </span>
                                <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Expires </span>
                                <span />
                            </div>

                            {/* Table rows */}
                            { paginated.map((grant) => {
                                const doc = grant.document;
                                const instance = doc?.stepInstance?.instance;
                                const expiresLabel = grant.expiresAt
                                    ? format(new Date(grant.expiresAt as unknown as string), 'dd MMM yyyy')
                                    : 'Never';
                                const sharedOnLabel = grant.createdAt
                                    ? format(new Date(grant.createdAt as unknown as string), 'dd MMM yyyy')
                                    : '—';

                                return (
                                    <div key={grant.id}
                                        className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_64px] gap-4 px-6 py-4 border-b border-black/4 last:border-b-0 items-center"
                                    >
                                        {/* Document name */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/3 shrink-0">
                                                <FileText className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-[Lato-Bold] text-black truncate leading-snug">
                                                    { doc?.fileName ?? 'Unknown file' }
                                                </p>
                                                <p className="text-xs font-[Lato-Regular] text-black/40 truncate mt-0.5">
                                                    { doc ? formatBytes(doc.fileSize) : '' }
                                                    { doc?.mimeType && <> · { doc.mimeType }</> }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Operation */}
                                        <div className="min-w-0">
                                            <p className="text-sm font-[Lato-Regular] text-black/75 truncate">
                                                { instance?.title ?? '—' }
                                            </p>
                                            { instance?.code &&
                                                <p className="text-[11px] font-[Lato-Regular] text-black/35 truncate mt-0.5">
                                                    { instance.code }
                                                </p>
                                            }
                                        </div>

                                        {/* Shared by */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <UserIcon className="w-3.5 h-3.5 text-black/30 shrink-0" />
                                            <span className="text-sm font-[Lato-Regular] text-black/70 truncate">
                                                { formatPersonName(grant.grantedBy) }
                                            </span>
                                        </div>

                                        {/* Shared on */}
                                        <span className="text-sm font-[Lato-Regular] text-black/60">
                                            { sharedOnLabel }
                                        </span>

                                        {/* Expires */}
                                        <span className={`text-sm font-[Lato-Regular] ${ grant.expiresAt ? 'text-black/60' : 'text-emerald-600' }`}>
                                            { expiresLabel }
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end">
                                            { doc &&
                                                <button onClick={() => setOtpConfig({ docId: doc.id, fileName: doc.fileName })}
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-black/40 hover:text-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        { sharedDocuments.length > pageSize &&
                            <div className="flex justify-end mt-4">
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={sharedDocuments.length}
                                    showSizeChanger
                                    onChange={(page, size) => {
                                        setCurrentPage(page);
                                        setPageSize(size);
                                    }}
                                />
                            </div>
                        }
                    </>
                :
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-black/3 flex items-center justify-center mb-4">
                            <Inbox className="w-7 h-7 text-black/25" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-[Lato-Bold] text-black/70">
                            No documents shared with you yet
                        </h3>
                        <p className="text-sm font-[Lato-Regular] text-black/40 mt-1 max-w-sm">
                            When someone grants you access to a document, it will appear here for you to download.
                        </p>
                    </div>
                }
            </div>

            { otpConfig &&
                <MyWorkspaceOTP {...otpConfig} onClose={() => setOtpConfig(null)} />
            }
        </div>
    );
};

export default SharedDocumentsManagement;
