import {
    gql
} from "@apollo/client";

/**************************************************************************** */
/************************** DIVISION FRAGMENTS ****************************** */
/**************************************************************************** */

export const APPOINTMENT_CORE_FIELDS = gql`
    fragment AppointmentDetail on Appointment {
        id
        name
        description
        startAt
        endAt
        users {
            id
            user {
                id
                firstName
                lastName
            }
        }
    }
`;

export const MUTATION_RESPONSE_FIELDS = gql`
    fragment MutationResponseFields on ApiResponse {
        success
        message
        errors {
            field
            message
        }
    }
`;