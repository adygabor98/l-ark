import type {
    FetchResult
} from "@apollo/client";
import {
    RETRIEVE_INSTANCES,
    RETRIEVE_INSTANCE_BY_ID
} from "../api/operation/operation-instances.queries";
import {
    CREATE_OPERATION_INSTANCE,
    UPDATE_INSTANCE_STATUS,
    UPDATE_STEP_INSTANCE,
    LINK_OPERATION_INSTANCES,
    UNLINK_OPERATION_INSTANCES,
    CLOSE_OPERATION,
    UPDATE_PAYMENT_STATUS,
    REMOVE_INSTANCE,
    EXECUTE_OPEN_OPERATION_STEP,
    SELECT_DOCUMENTS_TO_SHARE
} from "../api/operation/operation-instance.mutations";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import type {
    ApiResponse,
    OperationInstance,
    OperationInstanceInput,
    LinkOperationInstancesInput
} from "@l-ark/types";

interface UseOperationInstanceApiResponse {
    instances: OperationInstance[];
    instance: OperationInstance;

    retrieveInstances: (variables?: { officeId?: string; divisionId?: string; status?: string; assignedToId?: string; createdById?: string }) => FetchResult<{ data: OperationInstance[] }>;
    retrieveInstanceById: (variables: { id: number }) => FetchResult<{ data: OperationInstance }>;

    createInstance: (variables: { input: OperationInstanceInput }) => FetchResult<{ data: ApiResponse }>;

    updateInstanceStatus: (variables: { id: number; status: string }) => FetchResult<{ data: ApiResponse }>;
    updateStepInstance: (variables: { id: number; input: { status?: string; selectedEdgeId?: number; notifiedPersons?: string[]; checkedDocuments?: string[] } }) => FetchResult<{ data: ApiResponse }>;

    closeOperation: (variables: { input: { instanceId: string; paymentStatus: string } }) => FetchResult<{ data: ApiResponse }>;
    updatePaymentStatus: (variables: { instanceId: string; status: string }) => FetchResult<{ data: ApiResponse }>;
    
    linkInstances: (variables: { input: LinkOperationInstancesInput }) => FetchResult<{ data: ApiResponse }>;
    unlinkInstances: (variables: { input: { sourceInstanceId: number; targetInstanceId: number } }) => FetchResult<{ data: ApiResponse }>;

    deleteInstance: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    
    executeOpenOperationStep: (variables: { input: { stepInstanceId: number } }) => FetchResult<{ data: ApiResponse }>;
    selectDocumentsToShare: (variables: { input: { instanceId: string; targetInstanceId: string; documentIds: string[] } }) => FetchResult<{ data: ApiResponse }>;
}

export const useOperationInstance = (): UseOperationInstanceApiResponse => {
    /** Retrieve all instances */
    const [retrieveInstances, { data: instancesData }] = useLazyQueryWithToast(RETRIEVE_INSTANCES, { fetchPolicy: 'cache-and-network' });
    /** Retrieve a specific instance by ID */
    const [retrieveInstanceById, { data: instanceData }] = useLazyQueryWithToast(RETRIEVE_INSTANCE_BY_ID, { fetchPolicy: 'cache-and-network' });

    /** Create a new instance from a blueprint */
    const [createInstance] = useMutationWithToast(CREATE_OPERATION_INSTANCE, { refetchQueries: ['gqlRetrieveInstances'] });

    /** Update instance status */
    const [updateInstanceStatus] = useMutationWithToast(UPDATE_INSTANCE_STATUS, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Update a step instance */
    const [updateStepInstance] = useMutationWithToast(UPDATE_STEP_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });

    /** Close an operation with payment decision */
    const [closeOperation] = useMutationWithToast(CLOSE_OPERATION, { refetchQueries: ['gqlRetrieveInstanceById', 'gqlRetrieveInstances'] });
    /** Update payment status */
    const [updatePaymentStatus] = useMutationWithToast(UPDATE_PAYMENT_STATUS, { refetchQueries: ['gqlRetrieveInstanceById'] });

    /** Link instances together */
    const [linkInstances] = useMutationWithToast(LINK_OPERATION_INSTANCES, { refetchQueries: ['gqlRetrieveInstanceById', 'gqlRetrieveInstances'] });
    /** Remove a single OTHER_OTHER link between two instances */
    const [unlinkInstances] = useMutationWithToast(UNLINK_OPERATION_INSTANCES, { refetchQueries: ['gqlRetrieveInstanceById', 'gqlRetrieveInstances'] });
    
    /** Soft-delete an instance */
    const [deleteInstance] = useMutationWithToast(REMOVE_INSTANCE, { refetchQueries: ['gqlRetrieveInstances'] });
    
    /** Execute an OPEN_OPERATION step — creates sub-operation */
    const [executeOpenOperationStep] = useMutationWithToast(EXECUTE_OPEN_OPERATION_STEP, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Select documents to share on closure */
    const [selectDocumentsToShare] = useMutationWithToast(SELECT_DOCUMENTS_TO_SHARE, { refetchQueries: ['gqlRetrieveInstanceById'] });

    return {
        instances: instancesData?.data ?? [],
        instance: instanceData?.data ?? {},

        retrieveInstances: (variables?: { officeId?: string; divisionId?: string; status?: string; assignedToId?: string; createdById?: string }) => retrieveInstances({ variables }) as FetchResult<{ data: OperationInstance[] }>,
        retrieveInstanceById: (variables: { id: number }) => retrieveInstanceById({ variables }) as FetchResult<{ data: OperationInstance }>,

        createInstance: (variables: { input: OperationInstanceInput }) => createInstance({ variables }) as FetchResult<{ data: ApiResponse }>,
        
        updateInstanceStatus: (variables: { id: number; status: string }) => updateInstanceStatus({ variables }) as FetchResult<{ data: ApiResponse }>,
        updateStepInstance: (variables: { id: number; input: { status?: string; selectedEdgeId?: number; notifiedPersons?: string[]; checkedDocuments?: string[] } }) => updateStepInstance({ variables }) as FetchResult<{ data: ApiResponse }>,

        closeOperation: (variables: { input: { instanceId: string; paymentStatus: string } }) => closeOperation({ variables }) as FetchResult<{ data: ApiResponse }>,
        updatePaymentStatus: (variables: { instanceId: string; status: string }) => updatePaymentStatus({ variables }) as FetchResult<{ data: ApiResponse }>,

        linkInstances: (variables: { input: LinkOperationInstancesInput }) => linkInstances({ variables }) as FetchResult<{ data: ApiResponse }>,
        unlinkInstances: (variables: { input: { sourceInstanceId: number; targetInstanceId: number } }) => unlinkInstances({ variables }) as FetchResult<{ data: ApiResponse }>,
        
        deleteInstance: (variables: { id: number }) => deleteInstance({ variables }) as FetchResult<{ data: ApiResponse }>,
        
        executeOpenOperationStep: (variables: { input: { stepInstanceId: number } }) => executeOpenOperationStep({ variables }) as FetchResult<{ data: ApiResponse }>,
        selectDocumentsToShare: (variables: { input: { instanceId: string; targetInstanceId: string; documentIds: string[] } }) => selectDocumentsToShare({ variables }) as FetchResult<{ data: ApiResponse }>,
    };
};
