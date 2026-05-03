import {
    gql
} from "@apollo/client";
import {
    APPOINTMENT_CORE_FIELDS
} from "./agenda.fragments";

export const RETRIEVE_APPOINTMENTS = gql`
    ${ APPOINTMENT_CORE_FIELDS }

    query gqlRetrieveAppointments($date: DateTime, $type: AppointmentRangeType) {
        data: gqlRetrieveAppointments(date: $date, type: $type) {
            ...AppointmentDetail
        }
    }
`;

export const RETRIEVE_APPOINTMENT_BY_ID = gql`
    ${ APPOINTMENT_CORE_FIELDS }

    query gqlRetrieveAppointmentById($id: ID!) {
        data: gqlRetrieveAppointmentById(id: $id) {
            ...AppointmentDetail
        }
    }
`;