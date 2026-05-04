import { useMemo, type ReactElement } from 'react';
import { Inbox } from 'lucide-react';
import { LinkType } from '@l-ark/types';
import {
    useWorkspaceInstanceContext
} from '../context/workspace-instance.context';
import SharedDocumentsPanel, {
    getOriginInstanceId,
    type SharedDocumentRow
} from './shared-documents-panel';

interface PanelDescriptor {
    key: string;
    instanceLinkId: number;
    counterpartTitle?: string;
    mode: 'owner' | 'viewer';
    rows: SharedDocumentRow[];
}

/**
 * Aggregates all shared-document panels (incoming + outgoing) for the current
 * instance into the right context panel "Shared" tab. For each InstanceLink
 * (regardless of direction) we render up to two panels: one in `owner` mode
 * showing what THIS instance shares on the link, one in `viewer` mode showing
 * what the counterpart shares. Empty viewer/synthetic panels are hidden;
 * empty owner panels are kept ONLY for DEPENDS_ON links so the user can add
 * documents on demand.
 */
const RightPanelSharedTab = (): ReactElement => {
    const { instance } = useWorkspaceInstanceContext();

    const { incoming, outgoing } = useMemo(() => {
        const incoming: PanelDescriptor[] = [];
        const outgoing: PanelDescriptor[] = [];
        if (!instance) return { incoming, outgoing };

        const allLinks = [
            ...((instance.sourceLinks ?? []) as any[]).map(l => ({
                link: l,
                counterpartTitle: l.targetInstance?.title ?? `Instance #${l.targetInstanceId}`,
            })),
            ...((instance.targetLinks ?? []) as any[]).map(l => ({
                link: l,
                counterpartTitle: l.sourceInstance?.title ?? `Instance #${l.sourceInstanceId}`,
            })),
        ];

        for (const { link, counterpartTitle } of allLinks) {
            const rows = (link.sharedDocuments ?? []) as SharedDocumentRow[];
            const isDependsOn = link.linkType === LinkType.DEPENDS_ON;

            const ownedRows = rows.filter(r => {
                const origin = getOriginInstanceId(r);
                return origin == null ? false : origin === instance.id;
            });
            const viewerRows = rows.filter(r => {
                const origin = getOriginInstanceId(r);
                return origin == null ? true : origin !== instance.id;
            });

            // Owner panel: keep visible even when empty for DEPENDS_ON so the
            // user can hit Add. For non-DEPENDS_ON (synthetic full access) it
            // makes no sense to add per item, so drop empties.
            if (isDependsOn || ownedRows.length > 0) {
                outgoing.push({
                    key: `out-${link.id}`,
                    instanceLinkId: link.id,
                    counterpartTitle,
                    mode: 'owner',
                    rows,
                });
            }
            // Viewer panel: only show when the counterpart has actually shared
            // something with us.
            if (viewerRows.length > 0) {
                incoming.push({
                    key: `in-${link.id}`,
                    instanceLinkId: link.id,
                    counterpartTitle,
                    mode: 'viewer',
                    rows,
                });
            }
        }

        return { incoming, outgoing };
    }, [instance]);

    if (!instance) return <></>;

    if (incoming.length === 0 && outgoing.length === 0) {
        return (
            <div className="px-4 py-10 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-black/3 flex items-center justify-center mb-2">
                    <Inbox className="w-4 h-4 text-black/25" />
                </div>
                <p className="text-xs font-[Lato-Bold] text-black/50"> Nothing shared </p>
                <p className="text-[11px] font-[Lato-Regular] text-black/35 mt-0.5 max-w-56">
                    Documents shared in or out of this operation will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="p-3 space-y-3">
            { incoming.length > 0 &&
                <div className="space-y-2">
                    <p className="text-[10px] font-[Lato-Bold] text-black/30 uppercase tracking-widest px-1">
                        Shared with this operation
                    </p>
                    { incoming.map(p => (
                        <SharedDocumentsPanel
                            key={p.key}
                            instanceLinkId={p.instanceLinkId}
                            sharedDocuments={p.rows}
                            counterpartTitle={p.counterpartTitle}
                            mode={p.mode}
                            density="compact"
                        />
                    ))}
                </div>
            }
            { outgoing.length > 0 &&
                <div className="space-y-2">
                    <p className="text-[10px] font-[Lato-Bold] text-black/30 uppercase tracking-widest px-1">
                        Shared by this operation
                    </p>
                    { outgoing.map(p => (
                        <SharedDocumentsPanel
                            key={p.key}
                            instanceLinkId={p.instanceLinkId}
                            sharedDocuments={p.rows}
                            counterpartTitle={p.counterpartTitle}
                            mode={p.mode}
                            density="compact"
                        />
                    ))}
                </div>
            }
        </div>
    );
};

export default RightPanelSharedTab;
