import type {
    AvailableToken,
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
    if (Array.isArray(node.content)) {
        // Remove orphaned / incompatible fieldToken nodes entirely instead of
        // blanking them out — the user wants stale tokens gone, not "(removed)".
        node.content = node.content.filter((child: any) => {
            if (child?.type === 'fieldToken' && child.attrs &&
                (child.attrs.__orphaned === true || child.attrs.__incompatible === true)) {
                return false;
            }
            return true;
        });
        node.content.forEach(cleanTiptap);
    }
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

// ── Client-side reconciliation ────────────────────────────────────────────────

/**
 * Walk the whole layout and flag every field reference that no longer
 * exists in the current token list. This mirrors what the backend
 * `reconcileLayoutForVersion` does on version bumps, but runs client-side
 * so the designer catches stale references even when the user edits fields
 * without creating a new version.
 *
 * Only adds flags — never removes them. Already-flagged nodes are left alone.
 */

function flagTiptapOrphans(node: any, tokenIds: Set<string>): void {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'fieldToken' && node.attrs) {
        const fid = node.attrs.fieldId;
        if (fid && !tokenIds.has(String(fid)) && !node.attrs.__orphaned && !node.attrs.__incompatible) {
            node.attrs.__orphaned = true;
        }
    }
    if (Array.isArray(node.content)) node.content.forEach((child: any) => flagTiptapOrphans(child, tokenIds));
}

function flagBlockOrphans(block: ExportBlock, tokens: AvailableToken[], tokenIds: Set<string>): ExportBlock {
    const b: any = { ...block, settings: { ...(block.settings ?? {}) } };
    const s: any = b.settings;

    // Block-level sourceFieldId (TABLE, SIGNATURE, FIELD_GRID…)
    if (b.sourceFieldId && !tokenIds.has(String(b.sourceFieldId)) && !b.__orphaned && !b.__incompatible) {
        b.__orphaned = true;
    }

    // FIELD_GRID entries
    if (Array.isArray(s.gridEntries)) {
        s.gridEntries = s.gridEntries.map((entry: any) => {
            if (!entry?.fieldId || tokenIds.has(String(entry.fieldId))) return entry;
            if (entry.__orphaned || entry.__incompatible) return entry;
            return { ...entry, __orphaned: true };
        });
    }

    // TABLE column references — check both parent field and individual columns
    if (Array.isArray(s.tableColumns)) {
        const parentToken = b.sourceFieldId ? tokens.find((t: AvailableToken) => t.fieldId === String(b.sourceFieldId)) : null;
        const validColIds = new Set((parentToken?.columns ?? []).map((c: any) => String(c.id)));
        s.tableColumns = s.tableColumns.map((col: any) => {
            if (!col?.colId || col.__orphaned || col.__incompatible) return col;
            // Parent field already orphaned — don't double-flag columns
            if (b.__orphaned) return col;
            // Column ID no longer exists in the parent field's columns
            if (parentToken && !validColIds.has(String(col.colId))) {
                return { ...col, __orphaned: true, __reason: 'column-removed' };
            }
            return col;
        });
    }

    // CHECKBOX_GRID items
    if (Array.isArray(s.checkboxItems)) {
        s.checkboxItems = s.checkboxItems.map((item: any) => {
            if (!item?.fieldId || tokenIds.has(String(item.fieldId))) return item;
            if (item.__orphaned || item.__incompatible) return item;
            return { ...item, __orphaned: true };
        });
    }

    // FORM_GRID cells
    if (Array.isArray(s.formGridRows)) {
        s.formGridRows = s.formGridRows.map((row: any) => {
            if (!Array.isArray(row?.cells)) return row;
            return {
                ...row,
                cells: row.cells.map((cell: any) => {
                    if (!cell?.fieldId || tokenIds.has(String(cell.fieldId))) return cell;
                    if (cell.__orphaned || cell.__incompatible) return cell;
                    return { ...cell, __orphaned: true };
                }),
            };
        });
    }

    // RICH_TEXT TipTap content
    if (b.content) {
        const content = JSON.parse(JSON.stringify(b.content));
        flagTiptapOrphans(content, tokenIds);
        b.content = content;
    }

    return b as ExportBlock;
}

/**
 * Client-side pass: compare all field references in the layout against the
 * live token list and mark any that are missing as `__orphaned`. Safe to call
 * repeatedly — already-flagged nodes are untouched.
 */
export function reconcileLayoutAgainstTokens(
    rows: ExportRow[],
    pageConfig: ExportPageConfig,
    tokens: AvailableToken[]
): { rows: ExportRow[]; pageConfig: ExportPageConfig } {
    if (tokens.length === 0) return { rows, pageConfig };

    const tokenIds = new Set(tokens.map(t => String(t.fieldId)));

    const flaggedRows = rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => ({ ...cell, block: flagBlockOrphans(cell.block, tokens, tokenIds) })),
    }));

    const flaggedPageConfig: ExportPageConfig = { ...pageConfig };
    if (pageConfig.headerContent) {
        const header = JSON.parse(JSON.stringify(pageConfig.headerContent));
        flagTiptapOrphans(header, tokenIds);
        flaggedPageConfig.headerContent = header;
    }
    if (pageConfig.footerContent) {
        const footer = JSON.parse(JSON.stringify(pageConfig.footerContent));
        flagTiptapOrphans(footer, tokenIds);
        flaggedPageConfig.footerContent = footer;
    }

    return { rows: flaggedRows, pageConfig: flaggedPageConfig };
}
