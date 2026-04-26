import {
	useState,
	useRef,
	useEffect,
	useLayoutEffect,
	useMemo
} from "react";
import type {
	ExportRow,
	ExportPageConfig
} from "../../templates/export-layout/export-layout.models";
import {
	PAGE_DIMS,
	PX_PER_MM, ROW_GAP_PX
} from "../../templates/export-layout/export-layout.constants";

interface UseExportPaginationOptions {
	rows: ExportRow[];
	pageConfig: ExportPageConfig | null;
	loading: boolean;
}

export const useExportPagination = ({ rows, pageConfig, loading }: UseExportPaginationOptions) => {
	const rowMeasureRef = useRef<HTMLDivElement>(null);
	const headerMeasureRef = useRef<HTMLDivElement>(null);
	const footerMeasureRef = useRef<HTMLDivElement>(null);

	const [rowHeights, setRowHeights] = useState<number[]>([]);
	const [headerHeight, setHeaderHeight] = useState(0);
	const [footerHeight, setFooterHeight] = useState(0);

	// Filter content rows (exclude page breaks)
	const contentRows = useMemo(() => rows.filter(r => !r.cells.some(c => c.block.type === "PAGE_BREAK")), [rows]);

	const measure = (): void => {
		const container = rowMeasureRef.current;
		if ( container ) {
			const heights: number[] = [];
			for (let i = 0; i < container.children.length; i++) {
				heights.push((container.children[i] as HTMLElement).offsetHeight);
			}
			setRowHeights(heights);
		}
		setHeaderHeight(headerMeasureRef.current?.offsetHeight ?? 0);
		setFooterHeight(footerMeasureRef.current?.offsetHeight ?? 0);
	};

	useLayoutEffect(() => {
		if ( !loading && pageConfig )
			measure();
	}, [loading, contentRows, pageConfig]);

	useEffect(() => {
		if ( !loading && pageConfig ) {
			document.fonts.ready.then(() => measure());
		}
	}, [loading, contentRows]);

	// Pagination
	const pages = useMemo(() => {
		if ( !pageConfig || rows.length === 0 )
			return [{ rows: [] as ExportRow[], yOffset: 0 }];

		const dims = PAGE_DIMS[pageConfig.pageSize];
		const { top, bottom } = pageConfig.margins;
		const contentAreaHeight = dims.height - (top + bottom) * PX_PER_MM;
		const availableHeight = contentAreaHeight - headerHeight - footerHeight;

		const result: { rows: ExportRow[]; yOffset: number }[] = [{ rows: [], yOffset: 0 }];
		let currentHeight = 0;
		let contentIdx = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (row.cells.some(c => c.block.type === "PAGE_BREAK")) {
				result.push({ rows: [], yOffset: 0 });
				currentHeight = 0;
				continue;
			}

			const rowH = rowHeights[contentIdx] || 40;
			const gap = result[result.length - 1].rows.length > 0 ? ROW_GAP_PX : 0;

			if (availableHeight > 0 && currentHeight + gap + rowH > availableHeight && result[result.length - 1].rows.length > 0) {
				result.push({ rows: [], yOffset: 0 });
				currentHeight = 0;
			}

			result[result.length - 1].rows.push(row);
			currentHeight += (result[result.length - 1].rows.length === 1 ? 0 : ROW_GAP_PX) + rowH;
			contentIdx++;
		}

		if (result.length > 1 && result[result.length - 1].rows.length === 0) result.pop();
		return result;
	}, [rows, pageConfig, rowHeights, headerHeight, footerHeight]);

	return {
		pages,
		totalPages: pages.length,
		contentRows,
		rowMeasureRef,
		headerMeasureRef,
		footerMeasureRef,
	};
};
