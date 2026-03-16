import {
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    useParams,
    useNavigate
} from 'react-router-dom';
import {
    ExportLayoutProvider
} from './export-layout.context';
import {
    ExportErrorBoundary
} from './components/export-error-boundary';
import {
    useExportLayout
} from './export-layout.context';
import {
    useConfirmationExit
} from '../../../shared/hooks/useConfirmationExit';
import type {
    ExportLayoutRouteState
} from './export-layout.models';
import {
    useFileTemplate
} from '../../../server/hooks/useFileTemplate';
import type {
    FetchResult
} from '@apollo/client';
import type {
    FileTemplateDetail,
    FileTemplateExportLayout
} from '@l-ark/types';
import {
    Loader2,
    AlertCircle
} from 'lucide-react';
import ExportLayoutHeader from './components/export-layout-header';
import LeftPanel from './components/left-panel/left-panel';
import BlockCanvas from './components/canvas/block-canvas';
import TokenSidebar from './components/token-sidebar/token-sidebar';
import PreviewMode from './components/canvas/preview-mode';
import Button from '../../../shared/components/button';
import { useTranslation } from 'react-i18next';

const ExportLayoutInner = (): ReactElement => {
    const { t } = useTranslation();
    const { state, printRef, dispatch } = useExportLayout();
    const { retrieveFileTemplateExportLayout } = useFileTemplate();
    const isPreview = state.viewMode === 'preview';
    const [tokenSidebarOpen, setTokenSidebarOpen] = useState(true);

    // Block in-app navigation when there are unsaved changes
    useConfirmationExit(state.isDirty);

    // Load saved layout from backend on mount (if versionId is available)
    useEffect(() => {
        if (!state.versionId) return;

        const initialize = async () => {
            try {
                const response: FetchResult<{ data: FileTemplateExportLayout }> = await retrieveFileTemplateExportLayout({ templateVersionId: Number(state.versionId) })
                if( response ) {
                    const layout = (response as any)?.data?.data;
                    if (layout?.layoutData) {
                        const data = typeof layout.layoutData === 'string'
                            ? JSON.parse(layout.layoutData)
                            : layout.layoutData;

                        if (data.rows && data.pageConfig) {
                            dispatch({
                                type: 'LOAD_LAYOUT',
                                payload: { rows: data.rows, pageConfig: data.pageConfig },
                            });
                            return;
                        }
                    }
                }
                dispatch({ type: 'SET_LOADING', payload: false });
            } catch {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        }
        initialize();
    }, []);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative">
            <ExportLayoutHeader />

            <div className="flex flex-1 gap-2 overflow-hidden"> {/* This is the main body area */}
                { !isPreview && <LeftPanel /> }

                <main className="flex-1 relative overflow-y-auto bg-[#F3F4F6]">
                    { state.isLoading ? (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                <span className="text-sm text-black/40 font-[Lato-Regular]">{t('export-layout.loading-layout')}</span>
                            </div>
                        </div>
                    ) : (
                        <ExportErrorBoundary>
                            { isPreview ? <PreviewMode /> : <BlockCanvas /> }
                        </ExportErrorBoundary>
                    )}
                </main>

                { !isPreview && <TokenSidebar collapsed={!tokenSidebarOpen} onToggle={() => setTokenSidebarOpen(o => !o)} /> }
            </div>

            {/* Off-screen container for html2canvas PDF capture */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '-9999px',
                    width: '794px',
                    pointerEvents: 'none',
                    zIndex: -1,
                    opacity: 0,
                }}
            >
                <div ref={printRef} id="export-print-root">
                    <ExportErrorBoundary>
                        <PreviewMode forPrint />
                    </ExportErrorBoundary>
                </div>
            </div>
        </div>
    );
}

/** Pulsing skeleton bar */
const Bone = ({ className = '' }: { className?: string }): ReactElement => (
    <div className={`bg-black/6 rounded-md animate-pulse ${className}`} />
);

/** Full-page skeleton that mirrors the real page layout */
const PageLoading = (): ReactElement => (
    <div className="flex flex-col h-full w-full overflow-hidden">
        {/* ── Header skeleton ── */}
        <div className="min-h-15 flex items-center bg-white rounded-lg pr-4 shadow-sm shrink-0 mb-5 px-4 gap-4">
            <Bone className="w-32 h-5" />
            <div className="w-px h-5 bg-black/8" />
            <div className="flex-1 flex flex-col gap-1.5">
                <Bone className="w-48 h-4" />
                <Bone className="w-28 h-3" />
            </div>
            <div className="flex gap-2">
                <Bone className="w-24 h-9 rounded-sm" />
                <Bone className="w-28 h-9 rounded-sm" />
                <Bone className="w-28 h-9 rounded-sm" />
            </div>
        </div>

        {/* ── Body skeleton ── */}
        <div className="flex flex-1 gap-2 overflow-hidden">
            {/* Left panel */}
            <div className="w-65 shrink-0 bg-white rounded-lg shadow-sm p-4 flex flex-col gap-5">
                <div className="flex items-center gap-2">
                    <Bone className="w-4 h-4 rounded" />
                    <Bone className="w-28 h-4" />
                </div>
                <div className="flex flex-col gap-3">
                    <Bone className="w-20 h-3" />
                    <div className="flex gap-2">
                        <Bone className="flex-1 h-16 rounded-lg" />
                        <Bone className="flex-1 h-16 rounded-lg" />
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <Bone className="w-24 h-3" />
                    <div className="grid grid-cols-2 gap-2">
                        <Bone className="h-9 rounded-lg" />
                        <Bone className="h-9 rounded-lg" />
                        <Bone className="h-9 rounded-lg" />
                        <Bone className="h-9 rounded-lg" />
                    </div>
                </div>
                <Bone className="h-28 rounded-xl" />
                <Bone className="h-28 rounded-xl" />
            </div>

            {/* Canvas area */}
            <main className="flex-1 relative overflow-hidden bg-[#F3F4F6] flex flex-col items-center py-5 gap-3">
                {/* Zoom controls skeleton */}
                <Bone className="w-36 h-7 rounded-full" />

                {/* Paper skeleton */}
                <div className="bg-white relative rounded" style={{ width: 594, minHeight: 840, padding: '40px 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
                    <div className="flex flex-col gap-5">
                        <Bone className="w-3/5 h-6" />
                        <Bone className="w-full h-4" />
                        <Bone className="w-full h-4" />
                        <Bone className="w-4/5 h-4" />
                        <Bone className="w-full h-px bg-black/8 animate-none my-2" />
                        <Bone className="w-2/5 h-5" />
                        <Bone className="w-full h-4" />
                        <Bone className="w-full h-4" />
                        <Bone className="w-3/4 h-4" />
                        <Bone className="w-full h-20 rounded-lg" />
                        <Bone className="w-full h-4" />
                        <Bone className="w-2/3 h-4" />
                    </div>
                </div>
            </main>

            {/* Token sidebar */}
            <div className="w-65 shrink-0 bg-white rounded-lg shadow-sm p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Bone className="w-4 h-4 rounded" />
                    <Bone className="w-24 h-4" />
                </div>
                <Bone className="w-full h-8 rounded-lg" />
                <Bone className="w-full h-7 rounded bg-amber-50/50" />
                <div className="flex flex-col gap-3 mt-2">
                    <Bone className="w-20 h-3" />
                    <Bone className="w-full h-8 rounded-lg" />
                    <Bone className="w-full h-8 rounded-lg" />
                    <Bone className="w-full h-8 rounded-lg" />
                    <Bone className="w-16 h-3 mt-2" />
                    <Bone className="w-full h-8 rounded-lg" />
                    <Bone className="w-full h-8 rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

/** Error state when template data can't be fetched */
const PageError = (): ReactElement => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center h-full w-full bg-[#F3F4F6]">
            <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-black/60 font-[Lato-Regular]">{t('export-layout.error-load')}</p>
                <p className="text-xs text-black/35">{t('export-layout.error-load-description')}</p>
                <Button variant="secondary" onClick={() => navigate('/templates')} className="mt-2">
                    {t('common.back-to-templates')}
                </Button>
            </div>
        </div>
    );
};

export default function ExportLayoutPage(): ReactElement {
    const { templateId, versionId } = useParams<{ templateId: string; versionId: string }>();
    const navigate = useNavigate();
    const { retrieveFileTemplateById } = useFileTemplate();

    const [routeState, setRouteState] = useState<ExportLayoutRouteState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!templateId || !versionId) {
            navigate('/templates');
            return;
        }

        const init = async () => {
            try {
                // Run fetch + minimum display time in parallel so skeleton shows for ≥600ms
                const [tmplRes] = await Promise.all([
                    retrieveFileTemplateById({ id: Number(templateId) }) as Promise<FetchResult<{ data: FileTemplateDetail }>>,
                    new Promise(resolve => setTimeout(resolve, 600)),
                ]);
                const tmpl = (tmplRes as any)?.data?.data;

                if (!tmpl) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                const version = tmpl.versions?.[0];
                const sections = (version?.sections ?? []).map((s: any) => ({
                    id: String(s.id),
                    title: s.title,
                    fields: (s.fields ?? []).map((f: any) => ({
                        id: String(f.id),
                        label: f.label,
                        type: f.type,
                        options: f.options,
                        columns: f.columns,
                    })),
                }));

                setRouteState({
                    templateId,
                    templateName: tmpl.title ?? 'Untitled Template',
                    versionId,
                    sections,
                });
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [templateId, versionId]);

    if (error) return <PageError />;
    if (loading || !routeState) return <PageLoading />;

    return (
        <ExportLayoutProvider routeState={routeState}>
            <ExportLayoutInner />
        </ExportLayoutProvider>
    );
}
