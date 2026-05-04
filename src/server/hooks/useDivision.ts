
import type {
    FetchResult
} from "@apollo/client";
import {
    type ApiResponse,
    type DivisionBasic,
    type DivisionDetail,
    type DivisionInput,
    type DivisionResponse
} from "@l-ark/types";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import {
    RESTORE_DIVISION_BY_ID,
    CREATE_DIVISION,
    DERESTORE_DIVISION_BY_ID,
    RETRIEVE_DIVISION_BY_ID,
    RETRIEVE_DIVISIONS,
    UPDATE_DIVISION_BY_ID
} from "../api/division";

interface useDivisionResponse {
    divisions: Array<DivisionBasic>;
    division: DivisionDetail;

    retrieveDivisions: () => Promise<FetchResult<{ data: Array<DivisionBasic> }>>;
    retrieveDivisionById: (variables: { id: string }) => Promise<FetchResult<{ data: DivisionDetail }>>;

    createDivision: (variables: { input: DivisionInput }) => Promise<FetchResult<{ data: ApiResponse }>>;
    updateDivisionById: (variables: { id: string, input: DivisionInput }) => Promise<FetchResult<{ data: DivisionResponse }>>;

    deactivateDivision: (variables: { id: string }) => Promise<FetchResult<{ data: DivisionResponse }>>;
    activateDivision: (variables: { id: string }) => Promise<FetchResult<{ data: DivisionResponse }>>;
}

export const useDivision = (): useDivisionResponse => {
    /** Manage to retrieve divisions */
    const [ retrieveDivisions, { data: divisionsList }] = useLazyQueryWithToast(RETRIEVE_DIVISIONS, { fetchPolicy: 'cache-and-network' });
    /** Manage to retrieve a division by id */
    const [ retrieveDivisionById, { data: divisionData }] = useLazyQueryWithToast(RETRIEVE_DIVISION_BY_ID, { fetchPolicy: 'network-only' });

    /** Manage to create a new division */
    const [ createDivision ] = useMutationWithToast(CREATE_DIVISION, { refetchQueries: ['gqlRetrieveDivisions'] });
    /** Manage to update an existing division by id */
    const [ updateDivisionById ] = useMutationWithToast(UPDATE_DIVISION_BY_ID, { refetchQueries: ['gqlRetrieveDivisions', 'gqlRetrieveDivisionById'] });
    /** Manage to delete an existing division by id */
    const [ deactivateDivision ] = useMutationWithToast(DERESTORE_DIVISION_BY_ID, { refetchQueries: ['gqlRetrieveDivisionById', 'gqlRetrieveDivisions'], errorPolicy: 'all' });
    /** Manage to activate an division office by id */
    const [ activateDivision ] = useMutationWithToast(RESTORE_DIVISION_BY_ID, { refetchQueries: ['gqlRetrieveDivisionById', 'gqlRetrieveDivisions'], errorPolicy: 'all' });

    return {
        divisions: divisionsList?.data ?? [],
        retrieveDivisions: () => retrieveDivisions() as Promise<FetchResult<{ data: Array<DivisionBasic> }>>,

        division: divisionData?.data ?? {},
        retrieveDivisionById: (variables: { id: string }) => retrieveDivisionById({ variables: variables }) as Promise<FetchResult<{ data: DivisionDetail }>>,

        createDivision: (variables: { input: any }) => createDivision({ variables: variables }) as Promise<FetchResult<{ data: ApiResponse }>>,
        updateDivisionById: (variables: { id: string, input: any }) => updateDivisionById({ variables: variables }) as Promise<FetchResult<{ data: DivisionResponse }>>,

        deactivateDivision: (variables: { id: string }) => deactivateDivision({ variables: variables }) as Promise<FetchResult<{ data: DivisionResponse }>>,
        activateDivision: (variables: { id: string }) => activateDivision({ variables: variables }) as Promise<FetchResult<{ data: DivisionResponse }>>,
    };
}