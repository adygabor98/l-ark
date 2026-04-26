import {
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    useFileTemplate
} from '../../../../server/hooks/useFileTemplate';
import type {
    FetchResult
} from '@apollo/client';
import type {
    FileTemplateDetail,
    FileTemplateExportLayout,
    FileTemplateInstance
} from '@l-ark/types';
import type {
    AvailableToken,
    FieldColumn,
    FieldOption
} from '../../../templates/export-layout/export-layout.models';
import {
    Download,
    FileText,
    Loader2,
    X
} from 'lucide-react';
import {
    useExportPagination
} from '../../hooks/useExportPagination';
import {
    PAGE_DIMS
} from '../../../templates/export-layout/export-layout.constants';
import {
    FooterBand,
    HeaderBand,
    Watermark
} from './export-page-layout';
import {
    buildPreviewExtensions,
    buildZoneExtensions
} from '../../utils/export-tiptap-extensions';
import {
    RowPreview
} from './export-block-previews';
import Button from '../../../../shared/components/button';

interface PropTypes {
    templateId: number;
	formInstanceId: number;
	templateName?: string;

    onClose: Dispatch<SetStateAction<{ templateId: number; formInstanceId: number; templateName?: string } | null>>;
}

const ExportFileInstance = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { templateId, formInstanceId, onClose } = props;
    /** State to manage the loading state */
    const [loading, setLoading] = useState<boolean>(false);
    /** State to manage the export process */
    const [exporting, setExporting] = useState<boolean>(false);
    /** File template utilities */
    const { retrieveFileTemplateById, retrieveFileTemplateExportLayout, retrieveFormInstanceById } = useFileTemplate();
    /** State to manage the document name */
    const [docName, setDocName] = useState<string>('');
    /** State to manage the tokens */
    const [tokens, setTokens] = useState<AvailableToken[]>([]);
    /** State to manage the rows */
    const [rows, setRows] = useState<any[]>([]);
    /** State the manage the pagination configuraiton */
    const [pageConfig, setPageConfig] = useState<any>({});
    /** State to manage the form fields */
    const [fieldValues, setFieldValues] = useState<Map<string, unknown>>(new Map());
    /** Export pagination utilities */
    const { pages, totalPages } = useExportPagination({ rows, pageConfig, loading });
    const zoneExtensions = useMemo(() => buildZoneExtensions(fieldValues, tokens), [fieldValues, tokens]);
    const extensions = useMemo(() => buildPreviewExtensions(fieldValues, tokens), [fieldValues, tokens]);

    useEffect(() => {
        const initialize = async () => {
            try {
                const titleRes: FetchResult<{ data: FileTemplateDetail }> = await retrieveFileTemplateById({ id: templateId }) as any;
                setDocName(titleRes.data?.data.title ?? "Document");

                const formRes: FetchResult<{ data: FileTemplateInstance }> = await retrieveFormInstanceById({ id: formInstanceId });
                const formData: FileTemplateInstance | null = formRes?.data?.data ?? null;
                if ( !formData ) {
                    setLoading(false);
                    return;
                }

                const lockedVersion = formData.templateVersion;

                const availableTokens: AvailableToken[] = [];
                for (const section of (lockedVersion?.sections ?? [])) {
                    for (const field of (section.fields ?? []) as any[]) {
                        const stable = (field as any).stableId ?? field.id;
                        availableTokens.push({
                            fieldId: String(stable),
                            fieldLabel: field.label,
                            fieldType: field.type,
                            sectionTitle: section.title,
                            sectionId: String((section as any).stableId ?? section.id),
                            options: field.options  as unknown as FieldOption[],
                            columns: field.columns as unknown as FieldColumn[]
                        });
                    }
                }

                setTokens(availableTokens);

                if ( lockedVersion ) {
                    const layoutRes: FetchResult<{ data: FileTemplateExportLayout }> = await retrieveFileTemplateExportLayout({ templateVersionId: lockedVersion.id }) as any;
                    const layout: FileTemplateExportLayout | null = layoutRes?.data?.data ?? null;

                    const layoutData = typeof layout?.layoutData === "string" ? JSON.parse(layout.layoutData) : layout?.layoutData;

                    if ( layoutData?.rows ) {
                        setRows(layoutData.rows);
                    }
                    if ( layoutData?.pageConfig ) {
                        setPageConfig(layoutData.pageConfig);
                    }
                }

                const valueMap = new Map<string, unknown>();
                for (const fv of ((formData.fieldValues ?? []) as any[])) {
                    const stable = fv.stableFieldId ?? fv.field?.stableId;
                    if (stable) valueMap.set(String(stable), fv.value);
                }

                setFieldValues(valueMap);
                setLoading(false);
            } catch ( err: any ) {
                console.error(err);
                setLoading(false);
            }
        };
        initialize();
    }, [templateId, formInstanceId]);

    if( loading || !pageConfig || (pageConfig && Object.keys(pageConfig).length === 0)) {
        return <span> loading </span>
    }
    const dims = pageConfig ? (PAGE_DIMS as any)[pageConfig.pageSize] as any: PAGE_DIMS.A4;
    const margins = pageConfig?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 };

    /** Manage to generate and download the preview of the file template in PDF format */
    const onExportPdf = async (): Promise<void> => {
        if ( exporting ) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const pageEls = document.querySelectorAll<HTMLElement>('.export-page-paper');
            if ( pageEls.length === 0 ) return;

            const { default: jsPDF } = await import('jspdf');
            const { toPng } = await import('html-to-image');

            const A4_W_MM = 210;
            const A4_H_MM = 297;
            const SCALE = 2;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            for (let i = 0; i < pageEls.length; i++) {
                const el = pageEls[i];
                const prevShadow = el.style.boxShadow;
                el.style.boxShadow = 'none';

                const dataUrl = await toPng(el, { width: dims.width, height: dims.height, pixelRatio: SCALE, backgroundColor: '#FFFFFF' });

                el.style.boxShadow = prevShadow;

                if ( i > 0 ) pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, 0, A4_W_MM, A4_H_MM);
            }

            const safeName = (docName || 'Document').replace(/[^a-zA-Z0-9 _-]/g, '');
            pdf.save(`${safeName}.pdf`);
        } finally {
            setExporting(false);
        }
    };

    /** Manage to render the header */
    const renderHeader = (): ReactElement => (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-black/6 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-sm font-[Lato-Bold] text-black/80"> Export Preview </h2>
                    <p className="text-xs font-[Lato-Regular] text-black/40"> { docName } </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="primary" disabled={loading || exporting} onClick={onExportPdf}>
                    { exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    { exporting ? "Generating..." : "Download PDF"}
                </Button>
                <Button variant='icon' onClick={() => onClose(null)}>
                    <X className="w-4 h-4 text-black/40" />
                </Button>
            </div>
        </div>
    );

    const renderPage = (page: { rows: any[]; yOffset: number }, pageIdx: number) => (
        <div
            key={pageIdx}
            className="export-page-paper bg-white relative overflow-hidden"
            style={{
                width: dims.width,
                height: dims.height,
                padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
            }}
        >
            {pageConfig && <Watermark text={pageConfig.watermark ?? ""} pageWidth={dims.width} color={pageConfig.watermarkColor} opacity={pageConfig.watermarkOpacity} />}

            <div className="relative z-10 flex flex-col h-full">
                <div className="shrink-0">
                    {pageConfig && <HeaderBand pageConfig={pageConfig} zoneExtensions={zoneExtensions} />}
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-hidden" style={{ minHeight: 0 }}>
                    { page.rows.length === 0 ?
                        <p className="text-center text-sm text-black/20 italic py-8">Empty page</p>
                    :
                        page.rows.map(row => <RowPreview key={row.id} row={row} fieldValues={fieldValues} tokens={tokens} extensions={extensions} /> )
                    }
                </div>

                <div className="shrink-0">
                    {pageConfig && <FooterBand pageConfig={pageConfig} pageNum={pageIdx + 1} totalPages={totalPages} zoneExtensions={zoneExtensions} />}
                </div>
            </div>
        </div>
    );

    /** Render the content of the export component */
    const renderContent = (): ReactElement => (
        <div className="flex-1 overflow-auto flex flex-col items-center py-8 gap-6 px-4">
            { loading &&
                <div className="flex flex-col items-center gap-2 py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-sm text-black/40 font-[Lato-Regular]"> Loading export layout... </span>
                </div>
            }

            { !loading &&
                <>
                    { pages.map((page, pageIdx) => (
                        <div key={pageIdx} className="flex flex-col">
                            <div className="text-xs text-black/30 text-center mb-2 font-[Lato-Regular] select-none">
                                Page {pageIdx + 1} of {totalPages}
                            </div>
                            { renderPage(page, pageIdx) }
                        </div>
                    ))}
                </>
            }
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onClose(null)} />

            <div className="relative w-full max-w-5xl h-[90vh] bg-[#EBEBEB] rounded-2xl shadow-xl flex flex-col overflow-hidden">
                { renderHeader() }
                { renderContent() }
            </div>
        </div>
    );
}

export default ExportFileInstance;