import type {
    FetchResult
} from "@apollo/client";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import {
    RETRIEVE_APPOINTMENT_BY_ID,
    RETRIEVE_APPOINTMENTS
} from "../api/agenda/agenda.queries";
import type {
    ApiResponse,
    Appointment,
    AppointmentInput
} from "@l-ark/types";
import {
    CREATE_APPOINTMENT,
    DELETE_APPOINTMENT_BY_ID,
    UPDATE_APPOINTMENT_BY_ID
} from "../api/agenda/agenda.mutation";

interface useDivisionResponse {
    appointments: Appointment[];
    retrieveAppointments: (variables: { date?: Date, type: 'WEEK' | 'MONTH' }) => FetchResult<{ data: Appointment[] }>

    appointment: Appointment;
    retrieveAppointmentById: (variables: { id: string }) => FetchResult<{ data: Appointment }>;

    createAppointment: (variables: { input: AppointmentInput }) => FetchResult<{ data: ApiResponse }>;
    updateAppointment: (variables: { id: number, input: Partial<AppointmentInput> }) => FetchResult<{ data: ApiResponse }>;
    deleteAppointment: (variables: { id: number }) => FetchResult<{ data: ApiResponse }>;
}

export const useAgenda = (): useDivisionResponse => {
    /** Retrieve appointments */
    const [ retrieveAppointments, { data: appointmentsData } ] = useLazyQueryWithToast(RETRIEVE_APPOINTMENTS, { fetchPolicy: 'cache-and-network' });
    /** Retrieve appointment by id */
    const [ retrieveAppointmentById, { data: appointmentData } ] = useLazyQueryWithToast(RETRIEVE_APPOINTMENT_BY_ID, { fetchPolicy: 'cache-and-network' });

    /** Manage to create a new appointment */
    const [ createAppointment ] = useMutationWithToast(CREATE_APPOINTMENT, { refetchQueries: ['gqlRetrieveAppointments'] });
    /** Manage to create a new appointment */
    const [ updateAppointment ] = useMutationWithToast(UPDATE_APPOINTMENT_BY_ID, { refetchQueries: ['gqlRetrieveAppointments'] });
    /** Manage to create a new appointment */
    const [ deleteAppointment ] = useMutationWithToast(DELETE_APPOINTMENT_BY_ID, { refetchQueries: ['gqlRetrieveAppointments'] });

    return {
        appointments: appointmentsData?.data ?? [],
        retrieveAppointments: (variables: { date?: Date, type: 'WEEK' | 'MONTH' }) => retrieveAppointments({ variables: variables }) as FetchResult<{ data: Appointment[] }>,

        appointment: appointmentData?.data ?? {},
        retrieveAppointmentById: (variables: { id: string }) => retrieveAppointmentById({ variables: variables }) as FetchResult<{ data: Appointment }>,

        createAppointment: (variables: { input: AppointmentInput }) => createAppointment({ variables: variables }) as FetchResult<{ data: ApiResponse }>,
        updateAppointment: (variables: { id: number, input: Partial<AppointmentInput> }) => updateAppointment({ variables: variables }) as FetchResult<{ data: ApiResponse }>,
        deleteAppointment: (variables: { id: number }) => deleteAppointment({ variables: variables }) as FetchResult<{ data: ApiResponse }>
    };
}