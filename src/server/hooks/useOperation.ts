import type {
    FetchResult
} from "@apollo/client";
import {
    RETRIEVE_BLUEPRINTS,
    RETRIEVE_BLUEPRINT_BY_ID,
    RETRIEVE_INSTANCES,
    RETRIEVE_INSTANCE_BY_ID
} from "../api/operation/operation.queries";
import {
    CREATE_BLUEPRINT,
    UPDATE_BLUEPRINT,
    ACTIVATE_BLUEPRINT,
    ARCHIVE_BLUEPRINT,
    RESTORE_BLUEPRINT,
    REMOVE_BLUEPRINT,
    CREATE_INSTANCE,
    UPDATE_INSTANCE_STATUS,
    UPDATE_STEP_INSTANCE,
    LINK_INSTANCES,
    CLOSE_OPERATION,
    UPDATE_PAYMENT_STATUS,
    REMOVE_INSTANCE,
    EXECUTE_OPEN_OPERATION_STEP,
    SELECT_DOCUMENTS_TO_SHARE
} from "../api/operation/operation.mutations";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import type { OperationBlueprintInput, OperationBlueprint, OperationBlueprintDetail, OperationInstance } from "@l-ark/types";

interface ApiResponse {
    success: boolean;
    message: string;
    errors?: { field: string; message: string }[];
}

interface InstanceSummary {
    id: string;
    title: string;
    description: string;
    code: string;
    blueprintId: number;
    blueprint: { id: string; title: string; type: string; subType: string };
    officeId: number;
    office: { id: string; name: string; code: string };
    divisionId: number;
    division: { id: string; name: string };
    status: string;
    updatedAt: string;
    createdBy: { id: string; firstName: string; lastName: string };
    assignedTo: { id: string; firstName: string; lastName: string };
    stepInstances: { id: string; status: string }[];
    sourceLinks: { id: string; linkType: string }[];
    targetLinks: { id: string; linkType: string }[];
}


interface InstanceInput {
    blueprintId: number;
    officeId: number;
    description?: string;
}

interface LinkInput {
    sourceInstanceId: string;
    targetInstanceIds: string[];
    linkType: string;
}

interface UseOperationApiResponse {
    // Blueprint state
    blueprints: OperationBlueprint[];
    blueprint: OperationBlueprintDetail;

    // Blueprint queries
    retrieveBlueprints: (variables?: { divisionId?: string; type?: string }) => FetchResult<{ data: OperationBlueprint[] }>;
    retrieveBlueprintById: (variables: { id: number }) => FetchResult<{ data: OperationBlueprintDetail }>;

    // Blueprint mutations
    createBlueprint: (variables: { input: OperationBlueprintInput }) => FetchResult<{ data: ApiResponse }>;
    updateBlueprint: (variables: { id: number; input: OperationBlueprintInput }) => FetchResult<{ data: ApiResponse }>;
    activateBlueprint: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    deleteBlueprint: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;

    // Instance state
    instances: OperationInstance[];
    instance: OperationInstance;

    // Instance queries
    retrieveInstances: (variables?: { officeId?: string; divisionId?: string; status?: string; assignedToId?: string; createdById?: string }) => FetchResult<{ data: InstanceSummary[] }>;
    retrieveInstanceById: (variables: { id: number }) => FetchResult<{ data: OperationInstance }>;

    // Instance mutations
    createInstance: (variables: { input: InstanceInput }) => FetchResult<{ data: ApiResponse }>;
    updateInstanceStatus: (variables: { id: number; status: string }) => FetchResult<{ data: ApiResponse }>;
    updateStepInstance: (variables: { id: number; input: { status?: string; selectedEdgeId?: string; notifiedPersons?: string[]; checkedDocuments?: string[] } }) => FetchResult<{ data: ApiResponse }>;
    closeOperation: (variables: { input: { instanceId: string; paymentStatus: string } }) => FetchResult<{ data: ApiResponse }>;
    updatePaymentStatus: (variables: { instanceId: string; status: string }) => FetchResult<{ data: ApiResponse }>;
    linkInstances: (variables: { input: LinkInput }) => FetchResult<{ data: ApiResponse }>;
    deleteInstance: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    executeOpenOperationStep: (variables: { input: { stepInstanceId: string } }) => FetchResult<{ data: ApiResponse }>;
    selectDocumentsToShare: (variables: { input: { instanceId: string; targetInstanceId: string; documentIds: string[] } }) => FetchResult<{ data: ApiResponse }>;
    archiveBlueprint: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    restoreBlueprint: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
}

export const useOperation = (): UseOperationApiResponse => {
    /** Retrieve all blueprints */
    const [retrieveBlueprints, { data: blueprintsData }] = useLazyQueryWithToast(RETRIEVE_BLUEPRINTS, { fetchPolicy: 'cache-and-network' });
    /** Retrieve a specific blueprint by ID */
    const [retrieveBlueprintById, { data: blueprintData }] = useLazyQueryWithToast(RETRIEVE_BLUEPRINT_BY_ID, { fetchPolicy: 'cache-and-network' });

    /** Retrieve all instances */
    const [retrieveInstances, { data: instancesData }] = useLazyQueryWithToast(RETRIEVE_INSTANCES, { fetchPolicy: 'cache-and-network' });
    /** Retrieve a specific instance by ID */
    const [retrieveInstanceById, { data: instanceData }] = useLazyQueryWithToast(RETRIEVE_INSTANCE_BY_ID, { fetchPolicy: 'cache-and-network' });

    /** Create a new blueprint */
    const [createBlueprint] = useMutationWithToast(CREATE_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Update an existing blueprint */
    const [updateBlueprint] = useMutationWithToast(UPDATE_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprintById'] });
    /** Activate a blueprint */
    const [activateBlueprint] = useMutationWithToast(ACTIVATE_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprintById'] });
    /** Archive a blueprint */
    const [archiveBlueprint] = useMutationWithToast(ARCHIVE_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Restore an archived blueprint */
    const [restoreBlueprint] = useMutationWithToast(RESTORE_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Permanently delete a blueprint */
    const [deleteBlueprint] = useMutationWithToast(REMOVE_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });

    /** Create a new instance from a blueprint */
    const [createInstance] = useMutationWithToast(CREATE_INSTANCE, { refetchQueries: ['gqlRetrieveInstances'] });
    /** Update instance status */
    const [updateInstanceStatus] = useMutationWithToast(UPDATE_INSTANCE_STATUS, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Update a step instance */
    const [updateStepInstance] = useMutationWithToast(UPDATE_STEP_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Link instances together */
    const [linkInstances] = useMutationWithToast(LINK_INSTANCES, { refetchQueries: ['gqlRetrieveInstanceById', 'gqlRetrieveInstances'] });
    /** Close an operation with payment decision */
    const [closeOperation] = useMutationWithToast(CLOSE_OPERATION, { refetchQueries: ['gqlRetrieveInstanceById', 'gqlRetrieveInstances'] });
    /** Update payment status */
    const [updatePaymentStatus] = useMutationWithToast(UPDATE_PAYMENT_STATUS, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Soft-delete an instance */
    const [deleteInstance] = useMutationWithToast(REMOVE_INSTANCE, { refetchQueries: ['gqlRetrieveInstances'] });
    /** Execute an OPEN_OPERATION step — creates sub-operation */
    const [executeOpenOperationStep] = useMutationWithToast(EXECUTE_OPEN_OPERATION_STEP, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Select documents to share on closure */
    const [selectDocumentsToShare] = useMutationWithToast(SELECT_DOCUMENTS_TO_SHARE, { refetchQueries: ['gqlRetrieveInstanceById'] });

    return {
        // Blueprint state
        blueprints: blueprintsData?.data ?? [],
        blueprint: blueprintData?.data ?? {},
        // Blueprint queries
        retrieveBlueprints: (variables?: { divisionId?: string; type?: string }) => retrieveBlueprints({ variables }) as FetchResult<{ data: OperationBlueprint[] }>,
        retrieveBlueprintById: (variables: { id: number }) => retrieveBlueprintById({ variables }) as FetchResult<{ data: OperationBlueprintDetail }>,
        // Blueprint mutations
        createBlueprint: (variables: { input: OperationBlueprintInput }) => createBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        updateBlueprint: (variables: { id: number; input: OperationBlueprintInput }) => updateBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        activateBlueprint: (variables: { id: number }) => activateBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        archiveBlueprint: (variables: { id: number }) => archiveBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        restoreBlueprint: (variables: { id: number }) => restoreBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        deleteBlueprint: (variables: { id: number }) => deleteBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,

        // Instance state
        instances: instancesData?.data ?? [],
        instance: instanceData?.data ?? {},
        // Instance queries
        retrieveInstances: (variables?: { officeId?: string; divisionId?: string; status?: string; assignedToId?: string; createdById?: string }) => retrieveInstances({ variables }) as FetchResult<{ data: InstanceSummary[] }>,
        retrieveInstanceById: (variables: { id: number }) => retrieveInstanceById({ variables }) as FetchResult<{ data: OperationInstance }>,
        // Instance mutations
        createInstance: (variables: { input: InstanceInput }) => createInstance({ variables }) as FetchResult<{ data: ApiResponse }>,
        updateInstanceStatus: (variables: { id: number; status: string }) => updateInstanceStatus({ variables }) as FetchResult<{ data: ApiResponse }>,
        updateStepInstance: (variables: { id: number; input: { status?: string; selectedEdgeId?: string; notifiedPersons?: string[]; checkedDocuments?: string[] } }) => updateStepInstance({ variables }) as FetchResult<{ data: ApiResponse }>,
        closeOperation: (variables: { input: { instanceId: string; paymentStatus: string } }) => closeOperation({ variables }) as FetchResult<{ data: ApiResponse }>,
        updatePaymentStatus: (variables: { instanceId: string; status: string }) => updatePaymentStatus({ variables }) as FetchResult<{ data: ApiResponse }>,
        linkInstances: (variables: { input: LinkInput }) => linkInstances({ variables }) as FetchResult<{ data: ApiResponse }>,
        deleteInstance: (variables: { id: number }) => deleteInstance({ variables }) as FetchResult<{ data: ApiResponse }>,
        executeOpenOperationStep: (variables: { input: { stepInstanceId: string } }) => executeOpenOperationStep({ variables }) as FetchResult<{ data: ApiResponse }>,
        selectDocumentsToShare: (variables: { input: { instanceId: string; targetInstanceId: string; documentIds: string[] } }) => selectDocumentsToShare({ variables }) as FetchResult<{ data: ApiResponse }>,
    };
};
