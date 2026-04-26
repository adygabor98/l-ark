import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    type ReactElement
} from 'react';
import { flushSync } from 'react-dom';
import {
    useNavigate
} from 'react-router-dom';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Save,
    Loader2,
    Printer,
    Keyboard,
    Check,
    Circle
} from 'lucide-react';
import {
    useExportLayout
} from '../export-layout.context';
import {
    PAGE_DIMS
} from '../export-layout.constants';
import type {
    SaveStatus
} from '../export-layout.models';
import {
    useFileTemplate
} from '../../../../server/hooks/useFileTemplate';
import {
    useToast
} from '../../../../shared/hooks/useToast';
import {
    getResponseMessage
} from '../../../../server/hooks/useApolloWithToast';
import type {
    FetchResult
} from '@apollo/client';
import type {
    ApiResponse
} from '@l-ark/types';
import Button from '../../../../shared/components/button';
import { useTranslation } from 'react-i18next';
import { collectLayoutIssues } from '../utils/layout-reconciliation';

// Keyboard shortcuts popover
const SHORTCUTS = [
    { keys: 'Ctrl+S', action: 'Save layout' },
    { keys: 'Ctrl+D', action: 'Duplicate row' },
    { keys: 'Delete', action: 'Remove selected block' },
];

const ShortcutsPopover = ({ onClose }: { onClose: () => void }): ReactElement => {
    const { t } = useTranslation();
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-black/10 rounded-xl shadow-xl p-3 w-64">
                <p className="text-xs font-[Lato-Regular] text-black/50 uppercase tracking-wide mb-2"> {t('export-layout.keyboard-shortcuts')} </p>
                <div className="flex flex-col gap-1.5">
                    { SHORTCUTS.map(s => (
                        <div key={s.keys} className="flex justify-between items-center text-xs">
                            <span className="text-black/60"> { s.action } </span>
                            <kbd className="px-1.5 py-0.5 bg-black/5 border border-black/10 rounded text-[10px] font-mono text-black/50">
                                { s.keys }
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// ─── Auto-save status ────────────────────────────────────────────────────────

const ExportLayoutHeader = (): ReactElement => {
    /** Export layout api utilities */
    const { state, dispatch, saveCallbackRef, setRenderIntent } = useExportLayout();
    /** File template api utilities */
    const { savefileTemplateExportLayout } = useFileTemplate();
    /** Navigation utilities */
    const navigate = useNavigate();
    /** State to manage the preview of the status */
    const isPreview = state.viewMode === 'preview';
    /** State to manage the saving */
    const [saving, setSaving] = useState<boolean>(false);
    /** State to manage the saving status */
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    /** Manage to show the shortcuts */
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
    /** State to manage the last selected token */
    const lastSelectedRef = useRef<string | null>(null);
    /** Manage to count the number of blocks */
    const blockCount = state.rows.reduce((sum, row) => sum + row.cells.length, 0);
    /** Toast api utilities */
    const { onToast, onConfirmationToast, onPromiseToast } = useToast();
    const { t } = useTranslation();
    /** Generate a real PDF file using html-to-image + jsPDF.
     *  html-to-image uses the browser's native CSS engine (supports oklab, etc.)
     *  so it works with Tailwind v4 unlike html2canvas. */
    const handleExportPDF = async (): Promise<void> => {
        // Switch to preview mode if in edit mode (so pages are rendered)
        if (!isPreview) {
            dispatch({ type: 'SET_VIEW_MODE', payload: 'preview' });
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }

        // Flip to export-intent rendering: blank fields, print checkboxes,
        // no "Sample text" / "DD/MM/YYYY" literals leaking into the capture.
        // Reset in the finally block below so the builder UI keeps its
        // designer-friendly sample values.
        setRenderIntent('export');
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const generatePDF = async (): Promise<number> => {
          try {
            // Ensure fonts are loaded so pagination measurements are accurate
            await document.fonts.ready;
            // Allow one extra frame for re-measurement + re-render to settle
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const pageEls = document.querySelectorAll<HTMLElement>('#export-print-root .export-page-paper');
            if (pageEls.length === 0) throw new Error('No pages found to export');

            const { default: jsPDF } = await import('jspdf');
            const { toPng } = await import('html-to-image');

            const dims = PAGE_DIMS[state.pageConfig.pageSize];
            const A4_W_MM = 210;
            const A4_H_MM = 297;
            const SCALE = 2;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            for (let i = 0; i < pageEls.length; i++) {
                const el = pageEls[i];

                // Temporarily remove box shadow for clean capture
                const prevShadow = el.style.boxShadow;
                el.style.boxShadow = 'none';

                const dataUrl = await toPng(el, {
                    width: dims.width,
                    height: dims.height,
                    pixelRatio: SCALE,
                    backgroundColor: '#FFFFFF',
                });

                el.style.boxShadow = prevShadow;

                if (i > 0) pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, 0, A4_W_MM, A4_H_MM);
            }

            const safeName = (state.templateName || 'Document').replace(/[^a-zA-Z0-9 _-]/g, '');
            pdf.save(`${safeName} - Export.pdf`);
            return 200;
          } finally {
            // Always restore designer view so sample values reappear for
            // the next edit session, even if capture threw.
            setRenderIntent('design');
          }
        };

        onPromiseToast({
            cb: generatePDF(),
            loading: { title: t('export-layout.generating-pdf') },
            success: { title: t('export-layout.pdf-generated') },
            error: { title: t('export-layout.pdf-error') },
        });
    };

    /** Reconciliation summary — blocks save when orphaned/incompatible tokens remain */
    const issueSummary = useMemo(
        () => collectLayoutIssues(state.rows, state.pageConfig),
        [state.rows, state.pageConfig]
    );
    const hasUnresolvedIssues = issueSummary.issues.length > 0;

    /** Manage to save the export layout of the file template */
    const handleSave = useCallback(async () => {
        if (saving) return;

        if (hasUnresolvedIssues) {
            onToast({
                message: `Cannot save: ${issueSummary.issues.length} token reference${issueSummary.issues.length === 1 ? '' : 's'} no longer resolve. Fix or clear them first.`,
                type: 'error'
            });
            return;
        }

        const layoutData: JSON = { rows: state.rows, pageConfig: state.pageConfig } as unknown as JSON;

        if (!state.versionId) {
            dispatch({ type: 'MARK_CLEAN' });
            setSaveStatus('saved');
            return;
        }

        setSaving(true);
        setSaveStatus('saving');

        try {
            const response: FetchResult<{ data: ApiResponse<number> }> = await savefileTemplateExportLayout({
                templateVersionId: Number(state.versionId),
                input: { layoutData },
            });

            // Published version guard: ask the user before creating a new draft
            if (!response?.data?.data.success && response?.data?.data.message === 'PUBLISHED_VERSION_LOCKED') {
                setSaving(false);
                setSaveStatus('idle');

                const { confirmed } = await onConfirmationToast({
                    title: 'Template is published',
                    description: 'Saving will create a new draft version. You\'ll need to publish it for the changes to take effect.',
                    actionText: 'Create new version',
                    cancelText: 'Cancel',
                });

                if (!confirmed) return;

                setSaving(true);
                setSaveStatus('saving');

                try {
                    const forced: FetchResult<{ data: ApiResponse<number> }> = await savefileTemplateExportLayout({
                        templateVersionId: Number(state.versionId),
                        input: { layoutData, forceNewVersion: true },
                    });
                    flushSync(() => dispatch({ type: 'MARK_CLEAN' }));
                    onToast({ message: getResponseMessage(forced?.data?.data), type: 'success' });
                    navigate('/templates');
                } finally {
                    setSaving(false);
                }
                return;
            }

            if (response?.data?.data.success) {
                dispatch({ type: 'MARK_CLEAN' });
                setSaveStatus('saved');
            } else {
                setSaveStatus('error');
            }
            onToast({ message: getResponseMessage(response?.data?.data), type: response?.data?.data.success ? 'success' : 'error' });
        } catch {
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    }, [saving, hasUnresolvedIssues, issueSummary.issues.length, onToast, onConfirmationToast, navigate, state.rows, state.pageConfig, state.versionId, savefileTemplateExportLayout, dispatch]);

    /** Register save callback for keyboard shortcut (Ctrl+S) in context */
    useEffect(() => {
        saveCallbackRef.current = handleSave;
        return () => {
            saveCallbackRef.current = null;
        };
    }, [handleSave, saveCallbackRef]);


    /** Clear "saved" status after 3s  */
    useEffect(() => {
        if (saveStatus === 'saved') {
            const t = setTimeout(() => setSaveStatus('idle'), 3000);
            return () => clearTimeout(t);
        }
    }, [saveStatus]);

    /** Preview context preservation: remember selected block before switching */
    const handleTogglePreview = () => {
        if (!isPreview) {
            lastSelectedRef.current = state.selectedBlockId;
            dispatch({ type: 'SET_VIEW_MODE', payload: 'preview' });
        } else {
            dispatch({ type: 'SET_VIEW_MODE', payload: 'edit' });
            if (lastSelectedRef.current) {
                dispatch({ type: 'SELECT_BLOCK', payload: { id: lastSelectedRef.current } });
            }
        }
    };

    return (
        <header className="min-h-15 flex items-center justify-between bg-white rounded-lg pr-4 shadow-sm z-20 shrink-0 sticky top-0 mb-5">
            {/* Back */}
            <Button variant='ghost' onClick={() => navigate('/templates/builder', { state: { id: Number(state.templateId), step: 'builder' } })} className="flex items-center gap-1.5 text-sm text-black/40 hover:text-black/70 transition-colors mr-2">
                <ArrowLeft className="w-4 h-4" />
                {t('export-layout.back-to-builder')}
            </Button>

            <div className="w-px h-5 bg-black/8" />

            {/* Title */}
            <div className="flex-1">
                <h1 className="text-sm font-[Lato-Bold] text-black/70"> { state.templateName ? `${state.templateName} — ${t('export-layout.export-layout')}` : t('export-layout.title') } </h1>
                <p className="text-xs text-black/35 font-[Lato-Regular]">
                    { blockCount } block{ blockCount !== 1 ? 's' : '' } in { state.rows.length } row{ state.rows.length !== 1 ? 's' : '' } · { state.pageConfig.pageSize }
                </p>
            </div>

            {/* Save status indicator */}
            {saveStatus === 'saving' && (
                <span className="text-xs text-black/40 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('export-layout.saving')}
                </span>
            )}
            {saveStatus === 'saved' && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {t('export-layout.saved')}
                </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5">
                {/* Keyboard shortcuts help */}
                <div className="relative">
                    <button
                        onClick={() => setShowShortcuts(o => !o)}
                        title="Keyboard shortcuts"
                        className={`p-1.5 rounded-lg transition-colors ${
                            showShortcuts ? 'text-amber-600 bg-amber-50' : 'text-black/40 hover:text-black/70 hover:bg-black/4'
                        }`}
                    >
                        <Keyboard className="w-4 h-4" />
                    </button>
                    {showShortcuts && <ShortcutsPopover onClose={() => setShowShortcuts(false)} />}
                </div>

                <div className="w-px h-5 bg-black/8 mx-1" />

                <Button variant='secondary' onClick={handleTogglePreview}>
                    {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isPreview ? t('export-layout.edit') : t('export-layout.preview')}
                </Button>

                <Button variant='secondary' onClick={handleExportPDF}>
                    <Printer className="w-4 h-4" />
                    {t('export-layout.export-pdf')}
                </Button>

                <Button
                    variant='primary'
                    onClick={handleSave}
                    disabled={saving || hasUnresolvedIssues}
                    title={hasUnresolvedIssues ? 'Resolve layout issues before saving' : undefined}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? t('export-layout.saving') : (
                        <span className="flex items-center gap-1.5">
                            {t('export-layout.save-layout')}
                            {state.isDirty && <Circle className="w-2 h-2 fill-current" />}
                        </span>
                    )}
                </Button>
            </div>
        </header>
    );
}

export default ExportLayoutHeader;
