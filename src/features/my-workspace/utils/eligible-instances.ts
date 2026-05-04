import {
    LinkType,
    OperationInstanceStatus,
    type OperationInstance,
} from '@l-ark/types';

interface FilterEligibleArgs {
    /** Pool of instances to filter. */
    instances: OperationInstance[];
    /** Required blueprint id — only instances of this blueprint are considered. */
    blueprintId: number;
    /** Office to scope to (null = no office filter). */
    officeId: number | null;
    /** Allowed statuses — instance.status must be in this set. */
    allowedStatuses: ReadonlySet<OperationInstanceStatus>;
    /** Optional id to always include (e.g. the instance the user is currently in). */
    alwaysIncludeId?: number;
    /** Optional id to exclude (e.g. the instance the user is currently in). */
    excludeId?: number;
}

/**
 * Shared eligibility filter for "instances that can satisfy a prerequisite".
 *
 * Used by:
 *  - `/workspace/new` prerequisite selectors (linking on blueprint creation)
 *  - the request-operation modal (selecting completed OTHER instances to link
 *    to a Global)
 *
 * The two call-sites previously diverged on subtle details (status whitelist,
 * include-self semantics), which we surface explicitly as parameters here.
 *
 * Caps:
 *  - Respects `blueprint.maxGlobalOperations` — instances that have already
 *    hit their cap (current GLOBAL_OTHER target links ≥ max) are excluded.
 */
export function filterEligibleInstances({
    instances,
    blueprintId,
    officeId,
    allowedStatuses,
    alwaysIncludeId,
    excludeId,
}: FilterEligibleArgs): OperationInstance[] {
    return instances.filter(inst => {
        if (inst.blueprintId !== blueprintId) return false;
        if (excludeId != null && inst.id === excludeId) return false;
        if (alwaysIncludeId != null && inst.id === alwaysIncludeId) return true;
        if (officeId != null && inst.officeId !== officeId) return false;

        if (!allowedStatuses.has(inst.status as OperationInstanceStatus)) return false;

        const maxGlobal = inst.blueprint?.maxGlobalOperations ?? null;
        const currentGlobalCount = (inst.targetLinks ?? []).filter(
            (l: any) => l.linkType === LinkType.GLOBAL_OTHER,
        ).length;
        return maxGlobal === null || currentGlobalCount < maxGlobal;
    });
}

/**
 * Default whitelist: instances "complete enough" to act as a prerequisite for
 * a new GLOBAL operation. Captures the four terminal/post-work states.
 */
export const PREREQUISITE_ELIGIBLE_STATUSES: ReadonlySet<OperationInstanceStatus> = new Set([
    OperationInstanceStatus.COMPLETED_READY,
    OperationInstanceStatus.CLOSED,
    OperationInstanceStatus.PARTIALLY_CLOSED,
    OperationInstanceStatus.PENDING_PAYMENT,
]);
