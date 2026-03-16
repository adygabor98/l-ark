
import type {
    FetchResult
} from "@apollo/client";
import {
    type ApiResponse,
    type OfficeBasic,
    type OfficeDetail,
    type OfficeResponse
} from "@l-ark/types";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import {
    ACTIVATE_OFFICE_BY_ID,
    ASSIGN_DIVISION_TO_OFFICE,
    ASSIGN_USER_TO_OFFICE,
    CHECK_MULTIPLE_OFFICE_ASSIGNMENTS,
    CREATE_OFFICE,
    DELETE_OFFICE_BY_ID,
    RETRIEVE_OFFICE_BY_ID,
    RETRIEVE_OFFICES,
    UPDATE_OFFICE_BY_ID,
    UPDATE_OFFICE_DIVISION_ASSIGNMENT,
    UPDATE_OFFICE_USER_ASSIGNMENT
} from "../api/office";

interface useOfficeResponse {
    offices: Array<OfficeBasic>;
    office: OfficeDetail;

    retrieveOffices: () => Promise<FetchResult<{ data: Array<OfficeBasic> }>>;
    retrieveOfficeById: (variables: { id: string }) => Promise<FetchResult<{ data: OfficeDetail }>>;

    checkMultipleOfficeAssignments: (variables: { idUser: string, idOffice: string }) => Promise<FetchResult<{ data: boolean }>>;

    createOffice: (variables: { input: any }) => Promise<FetchResult<{ data: ApiResponse }>>;
    updateOfficeById: (variables: { id: string, input: any }) => Promise<FetchResult<{ data: OfficeResponse }>>;

    deactivateOffice: (variables: { id: string }) => Promise<FetchResult<{ data: OfficeResponse }>>;
    activateOffice: (variables: { id: string }) => Promise<FetchResult<{ data: OfficeResponse }>>;

    assignUserToOffice: (variables: { idOffice: string, idUser: string }) => Promise<FetchResult<{ data: OfficeResponse }>>;
    updateUserToOffice: (variables: { idOfficeUser: string, isEnabled: boolean }) => Promise<FetchResult<{ data: OfficeResponse }>>;
    
    assignOfficeToDivision: (variables: { idOffice: string, idDivision: string, idUser: string }) => Promise<FetchResult<{ data: ApiResponse }>>;
    updateOfficeToDivision: (variables: { idOfficeDivision: string, idOffice: string, idDivision: string, idUser: string, isEnabled: boolean }) => Promise<FetchResult<{ data: ApiResponse }>>;
}

export const useOffice = (): useOfficeResponse => {
    /** Manage to retrieve offices */
    const [ retrieveOffices, { data: officesList }] = useLazyQueryWithToast(RETRIEVE_OFFICES, { fetchPolicy: 'no-cache' });
    /** Manage to retrieve an office by id */
    const [ retrieveOfficeById, { data: officeData }] = useLazyQueryWithToast(RETRIEVE_OFFICE_BY_ID, { fetchPolicy: 'no-cache' });
    /** Check if the user is assigned to more than one offices  */
    const [ checkMultipleOfficeAssignments] = useLazyQueryWithToast(CHECK_MULTIPLE_OFFICE_ASSIGNMENTS, { fetchPolicy: 'no-cache' });

    /** Manage to create a new office */
    const [ createOffice ] = useMutationWithToast(CREATE_OFFICE, { refetchQueries: ['gqlRetrieveOffices'] });
    /** Manage to update an existing office by id */
    const [ updateOfficeById ] = useMutationWithToast(UPDATE_OFFICE_BY_ID, { refetchQueries: ['gqlRetrieveOffices', 'gqlRetrieveOfficeById'] });
    /** Manage to delete an existing office by id */
    const [ deactivateOffice ] = useMutationWithToast(DELETE_OFFICE_BY_ID, { refetchQueries: ['gqlRetrieveOfficeById', 'gqlRetrieveOffices'], errorPolicy: 'all' });
    /** Manage to activate an existing office by id */
    const [ activateOffice ] = useMutationWithToast(ACTIVATE_OFFICE_BY_ID, { refetchQueries: ['gqlRetrieveOfficeById', 'gqlRetrieveOffices'], errorPolicy: 'all' });

    /** Manage to assign a division to an office  */
    const [ assignOfficeToDivision ] = useMutationWithToast(ASSIGN_DIVISION_TO_OFFICE, { refetchQueries: ['gqlRetrieveDivisionById', 'gqlRetrieveOfficeById', 'gqlRetrieveDivisions', 'gqlRetrieveOffices'] });
    /** Manage to update an office division assignment  */
    const [ updateOfficeToDivision ] = useMutationWithToast(UPDATE_OFFICE_DIVISION_ASSIGNMENT, { refetchQueries: ['gqlRetrieveDivisionById', 'gqlRetrieveOfficeById', 'gqlRetrieveDivisions', 'gqlRetrieveOffices'] });
    /** Manage to assign a user to an office  */
    const [ assignUserToOffice ] = useMutationWithToast(ASSIGN_USER_TO_OFFICE, { refetchQueries: ['gqlRetrieveUserById', 'gqlRetrieveOfficeById', 'gqlRetrieveOffices'] });
    /** Manage to update an office user assignment  */
    const [ updateUserToOffice ] = useMutationWithToast(UPDATE_OFFICE_USER_ASSIGNMENT, { refetchQueries: ['gqlRetrieveUserById', 'gqlRetrieveOfficeById', 'gqlRetrieveOffices'] });

    return {
        offices: officesList?.data ?? [],
        retrieveOffices: () => retrieveOffices() as Promise<FetchResult<{ data: Array<OfficeBasic> }>>,

        office: officeData?.data ?? {},
        retrieveOfficeById: (variables: { id: string }) => retrieveOfficeById({ variables: variables }) as Promise<FetchResult<{ data: OfficeDetail }>>,

        checkMultipleOfficeAssignments: (variables: { idUser: string, idOffice: string }) => checkMultipleOfficeAssignments({ variables: variables }) as Promise<FetchResult<{ data: boolean }>>,

        createOffice: (variables: { input: any }) => createOffice({ variables: variables }) as Promise<FetchResult<{ data: ApiResponse }>>,
        updateOfficeById: (variables: { id: string, input: any }) => updateOfficeById({ variables: variables }) as Promise<FetchResult<{ data: OfficeResponse }>>,

        deactivateOffice: (variables: { id: string }) => deactivateOffice({ variables: variables }) as Promise<FetchResult<{ data: OfficeResponse }>>,
        activateOffice: (variables: { id: string }) => activateOffice({ variables: variables }) as Promise<FetchResult<{ data: OfficeResponse }>>,

        assignOfficeToDivision: (variables: { idOffice: string, idDivision: string, idUser: string }) => assignOfficeToDivision({ variables: variables }) as Promise<FetchResult<{ data: ApiResponse }>>,
        updateOfficeToDivision: (variables: { idOfficeDivision: string, idOffice: string, idDivision: string, idUser: string, isEnabled: boolean }) => updateOfficeToDivision({ variables: variables }) as Promise<FetchResult<{ data: ApiResponse }>>,
        assignUserToOffice: (variables: { idOffice: string, idUser: string }) => assignUserToOffice({ variables: variables }) as Promise<FetchResult<{ data: OfficeResponse }>>,
        updateUserToOffice: (variables: { idOfficeUser: string, isEnabled: boolean }) => updateUserToOffice({ variables: variables }) as Promise<FetchResult<{ data: OfficeResponse }>>
    };
}