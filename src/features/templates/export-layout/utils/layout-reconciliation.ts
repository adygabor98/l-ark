import type {
    ExportBlock,
    ExportPageConfig,
    ExportRow
} from '../export-layout.models';

/**
 * Mirror of the tags injected by the backend `reconcileLayoutForVersion`
 * walker when a layout is carried from one template version to another.
 *
 * The designer surfaces these so the user can remove/replace tokens that
 * no longer resolve before the layout is saved.
 */
export type LayoutIssueKind = 'orphaned-field' | 'orphaned-column' | 'incompatible-type';

export interface LayoutIssue {
    kind: LayoutIssueKind;
    blockId: string;
    /** Location of the ref inside the block (e.g. "sourceFieldId", "settings.gridEntries[0]"). */
    path: string;
    /** Legacy stableId that no longer resolves, when available. */
    stableId?: string;
    oldType?: string;
    newType?: string;
}

export interface LayoutReconciliationSummary {
    orphanedCount: number;
    incompatibleCount: number;
    issues: LayoutIssue[];
    /** Block ids that carry at least one issue (used for highlight). */
    blockIds: Set<string>;
}

const isFlaggedObj = (o: any): boolean =>
    !!o && typeof o === 'object' && (o.__orphaned === true || o.__incompatible === true);

const pushIfFlagged = (
    obj: any,
    blockId: string,
    path: string,
    stableId: string | undefined,
    out: LayoutIssue[]
): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.__orphaned === true) {
        out.push({
            kind: obj.__reason === 'column-removed' ? 'orphaned-column' : 'orphaned-field',
            blockId,
            path,
            stableId
        });
        return true;
    }
    if (obj.__incompatible === true) {
        out.push({
            kind: 'incompatible-type',
            blockId,
            path,
            stableId,
            oldType: typeof obj.__oldType === 'string' ? obj.__oldType : undefined,
            newType: typeof obj.__newType === 'string' ? obj.__newType : undefined
        });
        return true;
    }
    return false;
};

function walkTiptap(node: any, blockId: string, path: string, out: LayoutIssue[]): void {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'fieldToken' && node.attrs) {
        pushIfFlagged(node.attrs, blockId, `${path}.fieldToken`, node.attrs.fieldId, out);
    }
    if (Array.isArray(node.content)) {
        node.content.forEach((child: any, i: number) =>
            walkTiptap(child, blockId, `${path}.content[${i}]`, out)
        );
    }
}

function collectBlockIssues(block: ExportBlock, out: LayoutIssue[]): void {
    const b = block as any;

    // Top-level block flags (TABLE sourceFieldId, SIGNATURE sourceFieldId, etc.)
    if (b.__orphaned === true || b.__incompatible === true) {
        out.push({
            kind: b.__incompatible ? 'incompatible-type'
                : b.__reason === 'column-removed' ? 'orphaned-column' : 'orphaned-field',
            blockId: block.id,
            path: 'block',
            stableId: b.sourceFieldId,
            oldType: b.__oldType,
            newType: b.__newType
        });
    }

    const s: any = block.settings ?? {};

    if (Array.isArray(s.tableColumns)) {
        s.tableColumns.forEach((col: any, i: number) =>
            pushIfFlagged(col, block.id, `settings.tableColumns[${i}]`, col?.colId, out)
        );
    }
    if (Array.isArray(s.gridEntries)) {
        s.gridEntries.forEach((entry: any, i: number) =>
            pushIfFlagged(entry, block.id, `settings.gridEntries[${i}]`, entry?.fieldId, out)
        );
    }
    if (Array.isArray(s.formGridRows)) {
        s.formGridRows.forEach((row: any, ri: number) => {
            const cells: any[] = Array.isArray(row?.cells) ? row.cells : [];
            cells.forEach((cell: any, ci: number) =>
                pushIfFlagged(cell, block.id, `settings.formGridRows[${ri}].cells[${ci}]`, cell?.fieldId, out)
            );
        });
    }
    if (Array.isArray(s.checkboxItems)) {
        s.checkboxItems.forEach((item: any, i: number) =>
            pushIfFlagged(item, block.id, `settings.checkboxItems[${i}]`, item?.fieldId, out)
        );
    }

    if (block.content) walkTiptap(block.content, block.id, 'content', out);
}

/**
 * Walk the whole layout (rows + page header/footer) and surface every node
 * that carries a reconciliation tag, keyed by the owning block id so the
 * canvas can highlight the right cells and the header can block save.
 */
export function collectLayoutIssues(
    rows: ExportRow[],
    pageConfig: ExportPageConfig
): LayoutReconciliationSummary {
    const issues: LayoutIssue[] = [];
    for (const row of rows) {
        for (const cell of row.cells) collectBlockIssues(cell.block, issues);
    }
    // Header / footer TipTap content isn't scoped to a block — key it to a
    // sentinel id so the canvas can still surface a banner without trying to
    // ring a specific cell.
    if (pageConfig.headerContent) walkTiptap(pageConfig.headerContent, '__header__', 'pageConfig.headerContent', issues);
    if (pageConfig.footerContent) walkTiptap(pageConfig.footerContent, '__footer__', 'pageConfig.footerContent', issues);

    const orphanedCount = issues.filter(i => i.kind !== 'incompatible-type').length;
    const incompatibleCount = issues.filter(i => i.kind === 'incompatible-type').length;
    const blockIds = new Set(issues.map(i => i.blockId));

    return { issues, orphanedCount, incompatibleCount, blockIds };
}

/** True when the given block (or any of its nested refs) carries an issue tag. */
export function blockHasIssue(block: ExportBlock): boolean {
    const b = block as any;
    if (b.__orphaned === true || b.__incompatible === true) return true;

    const s: any = block.settings ?? {};
    if (Array.isArray(s.tableColumns) && s.tableColumns.some(isFlaggedObj)) return true;
    if (Array.isArray(s.gridEntries) && s.gridEntries.some(isFlaggedObj)) return true;
    if (Array.isArray(s.checkboxItems) && s.checkboxItems.some(isFlaggedObj)) return true;
    if (Array.isArray(s.formGridRows)) {
        for (const row of s.formGridRows) {
            if (Array.isArray(row?.cells) && row.cells.some(isFlaggedObj)) return true;
        }
    }
    return tiptapHasIssue(block.content);
}

function tiptapHasIssue(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    if (node.type === 'fieldToken' && isFlaggedObj(node.attrs)) return true;
    if (Array.isArray(node.content)) {
        for (const child of node.content) if (tiptapHasIssue(child)) return true;
    }
    return false;
}

// ── Cleanup walkers ───────────────────────────────────────────────────────────

/**
 * Strip every reconciliation tag and clear the dead reference the tag was
 * attached to. Called by the "Clear removed references" action in the canvas
 * banner — the user gives up on replacing and just wipes the stale tokens
 * so the layout can be saved.
 */

function cleanTagsInPlace(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    delete obj.__orphaned;
    delete obj.__incompatible;
    delete obj.__reason;
    delete obj.__oldType;
    delete obj.__newType;
}

function cleanTiptap(node: any): void {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'fieldToken' && node.attrs) {
        if (node.attrs.__orphaned === true || node.attrs.__incompatible === true) {
            node.attrs.fieldId = '';
            node.attrs.fallbackText = node.attrs.fallbackText ?? '(removed)';
        }
        cleanTagsInPlace(node.attrs);
    }
    if (Array.isArray(node.content)) node.content.forEach(cleanTiptap);
}

function cleanBlock(block: ExportBlock): ExportBlock {
    const b: any = { ...block, settings: { ...(block.settings ?? {}) } };

    if (b.__orphaned === true) {
        b.sourceFieldId = undefined;
    }
    cleanTagsInPlace(b);

    const s: any = b.settings;

    if (Array.isArray(s.tableColumns)) {
        s.tableColumns = s.tableColumns.map((col: any) => {
            if (col?.__orphaned === true) {
                const { __orphaned, __reason, __incompatible, __oldType, __newType, ...rest } = col;
                return { ...rest, colId: '' };
            }
            if (col?.__incompatible === true) {
                const { __incompatible, __oldType, __newType, __orphaned, __reason, ...rest } = col;
                return rest;
            }
            return col;
        });
    }
    if (Array.isArray(s.gridEntries)) {
        s.gridEntries = s.gridEntries.map((entry: any) => {
            if (!entry?.__orphaned && !entry?.__incompatible) return entry;
            const { __orphaned, __reason, __incompatible, __oldType, __newType, ...rest } = entry;
            return { ...rest, fieldId: undefined };
        });
    }
    if (Array.isArray(s.checkboxItems)) {
        s.checkboxItems = s.checkboxItems.map((item: any) => {
            if (!item?.__orphaned && !item?.__incompatible) return item;
            const { __orphaned, __reason, __incompatible, __oldType, __newType, ...rest } = item;
            return { ...rest, fieldId: undefined };
        });
    }
    if (Array.isArray(s.formGridRows)) {
        s.formGridRows = s.formGridRows.map((row: any) => {
            if (!Array.isArray(row?.cells)) return row;
            return {
                ...row,
                cells: row.cells.map((cell: any) => {
                    if (!cell?.__orphaned && !cell?.__incompatible) return cell;
                    const { __orphaned, __reason, __incompatible, __oldType, __newType, ...rest } = cell;
                    return { ...rest, fieldId: undefined, contentType: 'empty' };
                })
            };
        });
    }

    if (b.content) {
        const content = JSON.parse(JSON.stringify(b.content));
        cleanTiptap(content);
        b.content = content;
    }

    return b as ExportBlock;
}

export function stripLayoutIssues(
    rows: ExportRow[],
    pageConfig: ExportPageConfig
): { rows: ExportRow[]; pageConfig: ExportPageConfig } {
    const cleanedRows = rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => ({ ...cell, block: cleanBlock(cell.block) }))
    }));

    const cleanedPageConfig: ExportPageConfig = { ...pageConfig };
    if (pageConfig.headerContent) {
        const header = JSON.parse(JSON.stringify(pageConfig.headerContent));
        cleanTiptap(header);
        cleanedPageConfig.headerContent = header;
    }
    if (pageConfig.footerContent) {
        const footer = JSON.parse(JSON.stringify(pageConfig.footerContent));
        cleanTiptap(footer);
        cleanedPageConfig.footerContent = footer;
    }

    return { rows: cleanedRows, pageConfig: cleanedPageConfig };
}
