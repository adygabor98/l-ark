import { gql } from "@apollo/client";
import { MUTATION_RESPONSE_FIELDS } from "./agenda.fragments";

export const CREATE_APPOINTMENT = gql`
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlCreateAppointment($input: AppointmentInput) {
        data: gqlCreateAppointment(input: $input) {
            ...MutationResponseFields
        }
    }
`;

export const UPDATE_APPOINTMENT_BY_ID = gql`
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlUpdateAppointmentById($id: ID!, $input: AppointmentInput) {
        data: gqlUpdateAppointmentById(id: $id, input: $input) {
            ...MutationResponseFields
        }
    }
`;

export const DELETE_APPOINTMENT_BY_ID = gql`
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlDeleteAppointmentById($id: ID!) {
        data: gqlDeleteAppointmentById(id: $id) {
            ...MutationResponseFields
        }
    }
`;
