/**
 * Encoding helpers for `StepInstance.checkedDocuments` entries.
 *
 * A required-document name can be marked satisfied either by the user's own
 * upload (plain string entry) or by a document/form shared with this operation
 * via an InstanceLink (delimited entry with provenance metadata).
 *
 * Plain:                       "Lease.pdf"
 * Satisfied by shared form:    "Lease.pdf::SHARED::form::42"
 * Satisfied by shared file:    "Lease.pdf::SHARED::doc::99"
 */

export const SHARED_DELIM = '::SHARED::';

export interface CheckedDocEntry {
    docName: string;
    sharedKind?: 'form' | 'doc';
    sharedId?: number;
}

/** Parse a single raw `checkedDocuments` entry into structured form. */
export const parseCheckedEntry = (entry: string): CheckedDocEntry => {
    const idx = entry.indexOf(SHARED_DELIM);
    if (idx < 0) return { docName: entry };
    const docName = entry.slice(0, idx);
    const rest = entry.slice(idx + SHARED_DELIM.length).split('::');
    const kind = rest[0] === 'form' || rest[0] === 'doc' ? (rest[0] as 'form' | 'doc') : undefined;
    const id = rest[1] ? Number(rest[1]) : undefined;
    return { docName, sharedKind: kind, sharedId: Number.isFinite(id) ? id : undefined };
};

/** Find the entry matching a given docName, regardless of provenance encoding. */
export const findEntryForDoc = (
    checked: string[],
    docName: string,
): { entry: string; parsed: CheckedDocEntry } | null => {
    for (const e of checked) {
        const parsed = parseCheckedEntry(e);
        if (parsed.docName === docName) return { entry: e, parsed };
    }
    return null;
};

/** True when the requirement has been marked satisfied (by upload or by share). */
export const isDocChecked = (checked: string[], docName: string): boolean =>
    findEntryForDoc(checked, docName) !== null;

/** True when every expected requirement has a corresponding checked entry. */
export const areAllDocsChecked = (checked: string[], expected: string[]): boolean =>
    expected.every(d => isDocChecked(checked, d));

/** Build the encoded string for a SHARED-satisfied requirement. */
export const encodeSharedEntry = (docName: string, kind: 'form' | 'doc', id: number): string =>
    `${docName}${SHARED_DELIM}${kind}::${id}`;
