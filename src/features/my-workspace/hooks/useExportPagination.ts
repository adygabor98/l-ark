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

const arrEq = (a: number[], b: number[]): boolean => {
	if ( a.length !== b.length ) return false;
	for (let i = 0; i < a.length; i++) {
		if ( a[i] !== b[i] ) return false;
	}
	return true;
};

export const useExportPagination = ({ rows, pageConfig, loading }: UseExportPaginationOptions) => {
	const rowMeasureRef = useRef<HTMLDivElement>(null);
	const headerMeasureRef = useRef<HTMLDivElement>(null);
	const footerMeasureRef = useRef<HTMLDivElement>(null);

	const [rowHeights, setRowHeights] = useState<number[]>([]);
	const [headerHeight, setHeaderHeight] = useState(0);
	const [footerHeight, setFooterHeight] = useState(0);

	// Filter content rows (exclude page breaks). The measurement area only
	// renders contentRows, so rowHeights[i] aligns with contentRows[i].
	const contentRows = useMemo(() => rows.filter(r => !r.cells.some(c => c.block.type === "PAGE_BREAK")), [rows]);

	const measure = (): void => {
		const container = rowMeasureRef.current;
		if ( container ) {
			const heights: number[] = [];
			for (let i = 0; i < container.children.length; i++) {
				heights.push((container.children[i] as HTMLElement).offsetHeight);
			}
			setRowHeights(prev => arrEq(prev, heights) ? prev : heights);
		} else {
			setRowHeights(prev => prev.length === 0 ? prev : []);
		}

		const hh = headerMeasureRef.current?.offsetHeight ?? 0;
		setHeaderHeight(prev => prev === hh ? prev : hh);

		const fh = footerMeasureRef.current?.offsetHeight ?? 0;
		setFooterHeight(prev => prev === fh ? prev : fh);
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

			// Explicit page break — start a fresh page. PAGE_BREAK rows are
			// excluded from contentRows so contentIdx is NOT advanced here.
			if ( row.cells.some(c => c.block.type === "PAGE_BREAK") ) {
				result.push({ rows: [], yOffset: 0 });
				currentHeight = 0;
				continue;
			}

			const rowH = rowHeights[contentIdx] || 40;
			const gap  = result[result.length - 1].rows.length > 0 ? ROW_GAP_PX : 0;

			// Row doesn't fit on current page — push to next page first.
			if ( availableHeight > 0 && currentHeight + gap + rowH > availableHeight && result[result.length - 1].rows.length > 0 ) {
				result.push({ rows: [], yOffset: 0 });
				currentHeight = 0;
			}

			// Oversized row: row is taller than a single page's content area.
			// Emit the row on the current page, then continuation slices on
			// subsequent pages with a yOffset so the next vertical band is
			// shown via marginTop: -yOffset in the renderer.
			if ( availableHeight > 0 && rowH > availableHeight ) {
				result[result.length - 1].rows.push(row);

				let remaining = rowH - availableHeight;
				let offset    = availableHeight;
				while ( remaining > 0 ) {
					result.push({ rows: [row], yOffset: offset });
					offset    += availableHeight;
					remaining -= availableHeight;
				}

				// Next normal row starts on a fresh page
				result.push({ rows: [], yOffset: 0 });
				currentHeight = 0;
			} else {
				result[result.length - 1].rows.push(row);
				currentHeight += (result[result.length - 1].rows.length === 1 ? 0 : ROW_GAP_PX) + rowH;
			}

			contentIdx++;
		}

		if ( result.length > 1 && result[result.length - 1].rows.length === 0 ) result.pop();
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
