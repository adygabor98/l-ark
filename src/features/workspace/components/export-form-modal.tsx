import {
	useState,
	useEffect,
	useRef,
	useMemo,
	type ReactElement
} from "react";
import {
	X,
	Loader2,
	FileText,
	Download
} from "lucide-react";
import Button from "../../../shared/components/button";
import { useFileTemplate } from "../../../server/hooks/useFileTemplate";
import { useToast } from "../../../shared/hooks/useToast";
import type {
	ExportRow,
	ExportPageConfig,
	AvailableToken
} from "../../templates/export-layout/export-layout.models";
import { PAGE_DIMS, PX_PER_MM } from "../../templates/export-layout/export-layout.constants";
import { buildPreviewExtensions, buildZoneExtensions, type FieldValueMap } from "./export/export-tiptap-extensions";
import { RowPreview } from "./export/export-block-previews";
import { Watermark, HeaderBand, FooterBand } from "./export/export-page-layout";
import { useExportPagination } from "./export/use-export-pagination";

interface PropTypes {
	templateId: number;
	formInstanceId: number;
	templateName?: string;
	onClose: () => void;
}

const ExportFormModal = ({ templateId, formInstanceId, templateName, onClose }: PropTypes): ReactElement => {
	const { retrieveFileTemplateById, retrieveFileTemplateExportLayout, retrieveFormInstance } = useFileTemplate();
	const { onPromiseToast } = useToast();
	const [loading, setLoading] = useState(true);
	const [exporting, setExporting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [rows, setRows] = useState<ExportRow[]>([]);
	const [pageConfig, setPageConfig] = useState<ExportPageConfig | null>(null);
	const [fieldValues, setFieldValues] = useState<FieldValueMap>(new Map());
	const [tokens, setTokens] = useState<AvailableToken[]>([]);
	const [docName, setDocName] = useState(templateName ?? "Document");

	const printRef = useRef<HTMLDivElement>(null);

	const extensions = useMemo(() => buildPreviewExtensions(fieldValues, tokens), [fieldValues, tokens]);
	const zoneExtensions = useMemo(() => buildZoneExtensions(fieldValues, tokens), [fieldValues, tokens]);

	const { pages, totalPages, contentRows, rowMeasureRef, headerMeasureRef, footerMeasureRef } = useExportPagination({
		rows, pageConfig, loading
	});

	// Load everything on mount
	useEffect(() => {
		const init = async () => {
			try {
				const tmplRes = await retrieveFileTemplateById({ id: templateId }) as any;
				const tmpl = tmplRes?.data?.data;
				if (!tmpl) { setError("Template not found"); setLoading(false); return; }

				setDocName(tmpl.title ?? "Document");

				const version = tmpl.versions?.find((v: any) => v.isLatest) ?? tmpl.versions?.[0];
				if (!version) { setError("No template version found"); setLoading(false); return; }

				const availableTokens: AvailableToken[] = [];
				for (const section of version.sections ?? []) {
					for (const field of section.fields ?? []) {
						availableTokens.push({
							fieldId: String(field.id),
							fieldLabel: field.label,
							fieldType: field.type,
							sectionTitle: section.title,
							sectionId: String(section.id),
							options: field.options,
							columns: field.columns
						});
					}
				}

				setTokens(availableTokens);

				const layoutRes = await retrieveFileTemplateExportLayout({ templateVersionId: Number(version.id) }) as any;
				const layout = layoutRes?.data?.data;
				if (!layout?.layoutData) { setError("No export layout found for this template. Please create one first."); setLoading(false); return; }

				const layoutData = typeof layout.layoutData === "string" ? JSON.parse(layout.layoutData) : layout.layoutData;
				if (layoutData.rows) setRows(layoutData.rows);
				if (layoutData.pageConfig) setPageConfig(layoutData.pageConfig);

				const formRes = await retrieveFormInstance({ id: formInstanceId }) as any;
				const formData = formRes?.data?.data;
				if (!formData) { setError("Form instance not found"); setLoading(false); return; }

				const valueMap = new Map<string, unknown>();

				for (const fv of formData.fieldValues ?? []) {
					valueMap.set(String(fv.fieldId), fv.value);
				}
				setFieldValues(valueMap);
				setLoading(false);
			} catch (err) {
				setError("Failed to load export data");
				setLoading(false);
			}
		};
		init();
	}, [templateId, formInstanceId]);

	// PDF export
	const handleExportPDF = async () => {
		if (exporting) return;
		setExporting(true);

		const generatePDF = async (): Promise<number> => {
			await document.fonts.ready;
			await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

			const pageEls = printRef.current?.querySelectorAll<HTMLElement>(".export-page-paper");
			if (!pageEls || pageEls.length === 0) throw new Error("No pages found to export");

			const { default: jsPDF } = await import("jspdf");
			const { toPng } = await import("html-to-image");

			const dims = PAGE_DIMS[pageConfig!.pageSize];
			const A4_W_MM = 210;
			const A4_H_MM = 297;
			const SCALE = 2;

			const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

			for (let i = 0; i < pageEls.length; i++) {
				const el = pageEls[i];
				const prevShadow = el.style.boxShadow;
				el.style.boxShadow = "none";

				const dataUrl = await toPng(el, {
					width: dims.width,
					height: dims.height,
					pixelRatio: SCALE,
					backgroundColor: "#FFFFFF",
				});

				el.style.boxShadow = prevShadow;
				if (i > 0) pdf.addPage();
				pdf.addImage(dataUrl, "PNG", 0, 0, A4_W_MM, A4_H_MM);
			}

			const safeName = (docName || "Document").replace(/[^a-zA-Z0-9 _-]/g, "");
			pdf.save(`${safeName} - Export.pdf`);
			return 200;
		};

		try {
			await onPromiseToast({
				cb: generatePDF(),
				loading: { title: "Generating PDF..." },
				success: { title: "PDF generated successfully" },
				error: { title: "Failed to generate PDF" },
			});
		} finally {
			setExporting(false);
		}
	};

	if (!pageConfig && !loading && !error) return <></>;

	const dims = pageConfig ? PAGE_DIMS[pageConfig.pageSize] : PAGE_DIMS.A4;
	const margins = pageConfig?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 };
	const contentWidth = dims.width - (margins.left + margins.right) * PX_PER_MM;

	const renderPage = (page: { rows: ExportRow[]; yOffset: number }, pageIdx: number) => (
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
					{page.rows.length === 0 ? (
						<p className="text-center text-sm text-black/20 italic py-8">Empty page</p>
					) : (
						page.rows.map(row => (
							<RowPreview key={row.id} row={row} fieldValues={fieldValues} tokens={tokens} extensions={extensions} />
						))
					)}
				</div>

				<div className="shrink-0">
					{pageConfig && <FooterBand pageConfig={pageConfig} pageNum={pageIdx + 1} totalPages={totalPages} zoneExtensions={zoneExtensions} />}
				</div>
			</div>
		</div>
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			<div className="relative w-full max-w-5xl h-[90vh] bg-[#EBEBEB] rounded-2xl shadow-xl flex flex-col overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-3 bg-white border-b border-black/6 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
							<FileText className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<h2 className="text-sm font-[Lato-Bold] text-black/80">Export Preview</h2>
							<p className="text-xs font-[Lato-Regular] text-black/40">{docName}</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="primary" onClick={handleExportPDF} disabled={loading || !!error || exporting}>
							{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
							{exporting ? "Generating..." : "Download PDF"}
						</Button>
						<button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
							<X className="w-4 h-4 text-black/40" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto flex flex-col items-center py-8 gap-6 px-4">
					{loading && (
						<div className="flex flex-col items-center gap-2 py-20">
							<Loader2 className="w-6 h-6 animate-spin text-amber-500" />
							<span className="text-sm text-black/40 font-[Lato-Regular]">Loading export layout...</span>
						</div>
					)}

					{error && (
						<div className="flex flex-col items-center gap-2 py-20">
							<FileText className="w-8 h-8 text-red-400" />
							<p className="text-sm text-black/60 font-[Lato-Regular]">{error}</p>
						</div>
					)}

					{!loading && !error && (
						<>
							{pages.map((page, pageIdx) => (
								<div key={pageIdx} className="flex flex-col">
									<div className="text-xs text-black/30 text-center mb-2 font-[Lato-Regular] select-none">
										Page {pageIdx + 1} of {totalPages}
									</div>
									{renderPage(page, pageIdx)}
								</div>
							))}
						</>
					)}
				</div>

				{/* Hidden print area for PDF capture */}
				{!loading && !error && pageConfig && (
					<div
						style={{
							position: "fixed",
							top: 0,
							left: "-9999px",
							width: `${dims.width}px`,
							pointerEvents: "none",
							zIndex: -1,
							opacity: 0,
						}}
					>
						<div ref={printRef}>
							{pages.map((page, pageIdx) => renderPage(page, pageIdx))}
						</div>
					</div>
				)}

				{/* Hidden measurement area */}
				{!loading && !error && pageConfig && (
					<div
						aria-hidden="true"
						style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", left: -9999, top: 0 }}
					>
						<div ref={headerMeasureRef} style={{ width: contentWidth }}>
							<HeaderBand pageConfig={pageConfig} zoneExtensions={zoneExtensions} />
						</div>
						<div ref={footerMeasureRef} style={{ width: contentWidth }}>
							<FooterBand pageConfig={pageConfig} pageNum={1} totalPages={1} zoneExtensions={zoneExtensions} />
						</div>
						<div ref={rowMeasureRef} style={{ width: contentWidth }}>
							{contentRows.map(row => (
								<div key={row.id}>
									<RowPreview row={row} fieldValues={fieldValues} tokens={tokens} extensions={extensions} />
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ExportFormModal;
