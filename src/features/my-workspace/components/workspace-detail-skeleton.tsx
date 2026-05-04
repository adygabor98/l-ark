import {
    type ReactElement
} from 'react';

/**
 * Skeleton placeholder for the my-workspace detail page.
 * Mirrors the three-pane layout (header, timeline, focus, right panel) so the
 * shell doesn't reflow once data resolves.
 */
const WorkspaceDetailSkeleton = (): ReactElement => {
    return (
        <div className="h-full flex flex-col animate-pulse">
            {/* Header */}
            <div className="bg-white border border-black/6 rounded-xl shadow-sm p-4 mb-3">
                <div className="h-5 w-1/3 rounded bg-black/8 mb-3" />
                <div className="h-3 w-1/2 rounded bg-black/6 mb-4" />
                <div className="h-2 w-full rounded bg-black/4" />
            </div>

            {/* Body */}
            <div className="flex-1 flex gap-3 min-h-0">
                {/* Timeline */}
                <div className="w-64 xl:w-72 bg-white rounded-xl border border-black/6 shadow-sm p-3 flex flex-col gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 w-full rounded-lg bg-black/4" />
                    ))}
                </div>

                {/* Focus */}
                <div className="flex-1 min-w-0 bg-white rounded-xl border border-black/6 shadow-sm p-4 flex flex-col gap-3">
                    <div className="h-6 w-1/3 rounded bg-black/8" />
                    <div className="h-3 w-3/4 rounded bg-black/6" />
                    <div className="h-3 w-2/3 rounded bg-black/6" />
                    <div className="h-32 w-full rounded-lg bg-black/4 mt-2" />
                    <div className="h-32 w-full rounded-lg bg-black/4" />
                </div>

                {/* Right panel */}
                <div className="w-64 xl:w-72 bg-white rounded-xl border border-black/6 shadow-sm p-3 flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 w-full rounded-lg bg-black/4" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkspaceDetailSkeleton;
