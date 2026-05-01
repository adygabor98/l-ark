import type {
    FetchResult
} from "@apollo/client";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import type {
    OperationBlueprint,
    ApiResponse,
    OperationBlueprintInput,
    OperationBlueprintDetail
} from "@l-ark/types";
import {
    RETRIEVE_OPERATION_BLUEPRINT_BY_ID,
    RETRIEVE_OPERATION_BLUEPRINTS
} from "../api/operation/operation-blueprint.queries";
import {
    ARCHIVE_OPERATION_BLUEPRINT,
    CREATE_OPERATION_BLUEPRINT,
    DELETE_OPERATION_BLUEPRINT,
    DELETE_OPERATION_BLUEPRINT_VERSION,
    PUBLISH_OPERATION_BLUEPRINT,
    RESTORE_OPERATION_BLUEPRINT,
    UPDATE_OPERATION_BLUEPRINT
} from "../api/operation/operation-blueprint.mutations";

interface UseOperationBlueprintApiResponse {
    blueprints: OperationBlueprint[];
    retrieveBlueprints: (variables?: { divisionId?: string; type?: string }) => FetchResult<{ data: OperationBlueprint[] }>;

    retrieveBlueprintById: (variables: { id: string; versionId?: string }) => FetchResult<{ data: OperationBlueprintDetail }>;

    createOperationBlueprint: (variables: { input: OperationBlueprintInput }) => FetchResult<{ data: ApiResponse }>;
    updateOperationBlueprint: (variables: { id: string, input: OperationBlueprintInput }) => FetchResult<{ data: ApiResponse}>;
    publishBlueprint: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    deleteBlueprintVersion: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;

    archiveBlueprintOperation: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    restoreBlueprintOperation: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
    deleteBlueprintOperation: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
}

export const useOperationBlueprint = (): UseOperationBlueprintApiResponse => {
    /** Retrieve all blueprints */
    const [ retrieveBlueprints, { data: blueprintsData } ] = useLazyQueryWithToast(RETRIEVE_OPERATION_BLUEPRINTS, { fetchPolicy: 'cache-and-network' });
    /** Retrieve a specific operation blueprint */
    const [ retrieveBlueprintById ] = useLazyQueryWithToast(RETRIEVE_OPERATION_BLUEPRINT_BY_ID, { fetchPolicy: 'cache-and-network' });
   
    /** Create a new blueprint */
    const [ createOperationBlueprint ] = useMutationWithToast(CREATE_OPERATION_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Update an existing blueprint */
    const [ updateOperationBlueprint ] = useMutationWithToast(UPDATE_OPERATION_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprintById'] });
    
    /** Archive a blueprint */
    const [ archiveBlueprint ] = useMutationWithToast(ARCHIVE_OPERATION_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Restore an archived blueprint */
    const [ restoreBlueprint ] = useMutationWithToast(RESTORE_OPERATION_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Permanently delete a blueprint */
    const [ deleteBlueprint ] = useMutationWithToast(DELETE_OPERATION_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprints'] });
    /** Publish the latest DRAFT version */
    const [ publishBlueprintMutation ] = useMutationWithToast(PUBLISH_OPERATION_BLUEPRINT, { refetchQueries: ['gqlRetrieveOperationBlueprintById', 'gqlRetrieveOperationBlueprints'] });
    /** Delete a DRAFT blueprint version */
    const [ deleteBlueprintVersionMutation ] = useMutationWithToast(DELETE_OPERATION_BLUEPRINT_VERSION, { refetchQueries: ['gqlRetrieveOperationBlueprintById'] });

    return {
        blueprints: blueprintsData?.data ?? [],
        retrieveBlueprints: (variables?: { divisionId?: string; type?: string }) => retrieveBlueprints({ variables: variables }) as FetchResult<{ data: OperationBlueprint[] }>,

        retrieveBlueprintById: (variables: { id: string; versionId?: string }) => retrieveBlueprintById({ variables }) as FetchResult<{ data: OperationBlueprintDetail }>,
        createOperationBlueprint: (variables: { input: OperationBlueprintInput }) => createOperationBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        updateOperationBlueprint: (variables: { id: string, input: OperationBlueprintInput }) => updateOperationBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        publishBlueprint: (variables: { id: number }) => publishBlueprintMutation({ variables }) as FetchResult<{ data: ApiResponse }>,
        deleteBlueprintVersion: (variables: { id: number }) => deleteBlueprintVersionMutation({ variables }) as FetchResult<{ data: ApiResponse }>,
        archiveBlueprintOperation: (variables: { id: number }) => archiveBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        restoreBlueprintOperation: (variables: { id: number }) => restoreBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>,
        deleteBlueprintOperation: (variables: { id: number }) => deleteBlueprint({ variables }) as FetchResult<{ data: ApiResponse }>
    };
};
