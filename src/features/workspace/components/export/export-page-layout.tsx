import type { ReactElement } from "react";
import { generateHTML } from "@tiptap/core";
import type { ExportPageConfig } from "../../../templates/export-layout/export-layout.models";
import {
	WATERMARK_CHAR_FACTOR,
	WATERMARK_MIN_FONT_PX,
	WATERMARK_MAX_FONT_PX,
} from "../../../templates/export-layout/export-layout.constants";

export const Watermark = ({ text, pageWidth, color, opacity }: { text: string; pageWidth: number; color?: string; opacity?: number }): ReactElement | null => {
	if (!text) return null;
	const maxWidth = pageWidth * 0.85;
	const calculated = Math.floor(maxWidth / (text.length * WATERMARK_CHAR_FACTOR));
	const size = Math.min(WATERMARK_MAX_FONT_PX, Math.max(WATERMARK_MIN_FONT_PX, calculated));
	return (
		<div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
			<span
				className="font-[Lato-Black] uppercase tracking-widest text-center"
				style={{ fontSize: size, transform: "rotate(-35deg)", maxWidth: "90%", wordBreak: "break-word", color: color ?? "#000000", opacity: opacity ?? 0.08 }}
			>
				{text}
			</span>
		</div>
	);
};

export const HeaderBand = ({ pageConfig, zoneExtensions }: { pageConfig: ExportPageConfig; zoneExtensions: any[] }): ReactElement | null => {
	if (!pageConfig.showHeader) return null;
	const logoWidth = pageConfig.logoWidth ?? 40;
	let headerHtml = "";
	if (pageConfig.headerContent) {
		try { headerHtml = generateHTML(pageConfig.headerContent as never, zoneExtensions); } catch { /* empty */ }
	}
	return (
		<div className="flex items-start gap-3 pb-2 mb-3 text-xs text-black/50">
			{pageConfig.showLogo && pageConfig.logoUrl ? (
				<img src={pageConfig.logoUrl} alt="Logo" className="shrink-0 object-contain rounded" style={{ width: logoWidth, height: logoWidth }} />
			) : (
				<div className="bg-black/8 rounded flex items-center justify-center text-black/30 text-[10px] shrink-0" style={{ width: logoWidth, height: logoWidth }}>
					LOGO
				</div>
			)}
			{headerHtml && <div className="flex-1 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: headerHtml }} />}
		</div>
	);
};

export const FooterBand = ({
	pageConfig,
	pageNum,
	totalPages,
	zoneExtensions,
}: {
	pageConfig: ExportPageConfig;
	pageNum: number;
	totalPages: number;
	zoneExtensions: any[];
}): ReactElement | null => {
	if (!pageConfig.showFooter) return null;
	const pos = pageConfig.pageNumberPosition;
	const pageLabel = pos !== "none" ? `Page ${pageNum} of ${totalPages}` : null;
	let footerHtml = "";
	if (pageConfig.footerContent) {
		try { footerHtml = generateHTML(pageConfig.footerContent as never, zoneExtensions); } catch { /* empty */ }
	}
	return (
		<div className="pt-2 mt-3 border-t border-black/10 text-xs text-black/50">
			{footerHtml && <div className="mb-1 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: footerHtml }} />}
			{pageLabel && (
				<div className={pos === "center" ? "text-center" : pos === "right" ? "text-right" : "text-left"}>
					{pageLabel}
				</div>
			)}
		</div>
	);
};
