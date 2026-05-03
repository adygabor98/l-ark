import {
    type FC,
    type ReactElement,
} from 'react';
import {
    AlertTriangle,
} from 'lucide-react';
import {
    StepType,
    type BlueprintStep,
    type OperationInstance,
} from '@l-ark/types';
import InstanceWaitForLinkedStep from './instance-step-config/instance-wait-for-linked-step';
import InstanceOpenOperationStep from './instance-step-config/instance-open-operation-step';
import InstanceAllowInstanceLinkStep from './instance-step-config/instance-allow-instance-link-step';
import InstanceNotificationStep from './instance-step-config/instance-notification-step';
import InstanceUploadDocumentsStep from './instance-step-config/instance-upload-documents-step';
import InstanceFileTemplatesStep from './instance-step-config/instance-file-templates-step';
import InstanceStandardStep from './instance-step-config/instance-standard-step';
import InstanceFooterStep from './instance-step-config/instance-footer-step';

interface StepRenderProps {
    isReadOnly: boolean;
}

/**
 * Primary renderers keyed on `BlueprintStep.stepType`. One renderer per type;
 * STANDARD and CLOSURE intentionally have no primary renderer because their
 * content comes entirely from the orthogonal feature modules below.
 */
const STEP_PRIMARY_RENDERERS: Partial<Record<StepType, FC<StepRenderProps>>> = {
    [StepType.WAIT_FOR_LINKED]: () => <InstanceWaitForLinkedStep />,
    [StepType.OPEN_OPERATION]: ({ isReadOnly }) => <InstanceOpenOperationStep isReadOnly={isReadOnly} />,
    // NOTIFICATION primary renderer is conditional on `notificationPersons.length` —
    // we re-check that inside the renderer rather than pulling it into the map key.
    [StepType.NOTIFICATION]: ({ isReadOnly }) => <InstanceNotificationStep isReadOnly={isReadOnly} />,
};

/**
 * Dev-visible fallback when a step lands with an unknown stepType — typically
 * means a blueprint version was published with a step type the frontend
 * doesn't yet support, or there's a data corruption issue.
 */
const UnknownStepFallback: FC<{ stepType: string }> = ({ stepType }) => (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 font-[Lato-Regular]">
            <div className="font-[Lato-Bold] mb-0.5"> Unsupported step type </div>
            <div>
                The step type <code className="font-mono">{stepType}</code> is not recognised by this version of the workspace UI.
                Contact support if this persists.
            </div>
        </div>
    </div>
);

interface StepRenderersProps {
    blueprintStep: BlueprintStep;
    instance: OperationInstance | null;
    isReadOnly: boolean;
}

/**
 * Renders the body of the step focus pane: the type-specific primary renderer
 * (resolved via `STEP_PRIMARY_RENDERERS`) plus the orthogonal feature modules
 * (allow-link, documents, templates, standard fallback) that layer on top
 * regardless of stepType.
 *
 * Replaces the previous 11-condition if-ladder so an unknown stepType lands
 * a visible fallback instead of silently rendering nothing.
 */
const StepRenderers = ({ blueprintStep, instance, isReadOnly }: StepRenderersProps): ReactElement => {
    const stepType = blueprintStep.stepType ?? StepType.STANDARD;
    const Primary = STEP_PRIMARY_RENDERERS[stepType];

    // Conditional layer flags — kept as locals so the JSX below stays readable.
    const showNotificationGate = stepType === StepType.NOTIFICATION
        && (blueprintStep.notificationPersons?.length ?? 0) > 0;
    const showInstanceLink = blueprintStep.allowInstanceLink && !isReadOnly;
    const expectedDocuments = (blueprintStep.expectedDocuments ?? []).filter(Boolean);
    const showDocuments = expectedDocuments.length > 0 || blueprintStep.allowDocumentUpload;
    const showFileTemplates = (blueprintStep.fileTemplates?.length ?? 0) > 0;
    const showStandardFallback = stepType === StepType.STANDARD
        && !blueprintStep.allowDocumentUpload
        && (blueprintStep.fileTemplates?.length ?? 0) === 0
        && !blueprintStep.allowInstanceLink;
    const showFooter = !isReadOnly && stepType !== StepType.OPEN_OPERATION;

    // If the step type is something we don't know about and isn't STANDARD, show the fallback.
    const isKnownType = Primary != null
        || stepType === StepType.STANDARD
        || stepType === StepType.CLOSURE;

    return (
        <>
            {Primary && stepType !== StepType.NOTIFICATION && <Primary isReadOnly={isReadOnly} />}
            {showNotificationGate && Primary && <Primary isReadOnly={isReadOnly} />}

            {!isKnownType && <UnknownStepFallback stepType={String(stepType)} />}

            {showInstanceLink && (
                <InstanceAllowInstanceLinkStep
                    allowLinkBlueprintIds={
                        (blueprintStep.allowInstanceLinkBlueprints ?? [])
                            .map((b: any) => b.blueprint?.id ?? b.blueprintId)
                            .filter((id: number) => id != null)
                    }
                />
            )}

            {showDocuments && (
                <InstanceUploadDocumentsStep
                    instanceId={instance?.id ? instance.id : null}
                    isReadOnly={isReadOnly}
                />
            )}

            {showFileTemplates && <InstanceFileTemplatesStep isReadOnly={isReadOnly} />}

            {showStandardFallback && <InstanceStandardStep />}

            {showFooter && <InstanceFooterStep isReadOnly={isReadOnly} />}
        </>
    );
};

export default StepRenderers;
