import {
    gql
} from "@apollo/client";
import {
    BLUEPRINT_SUMMARY_FIELDS,
    BLUEPRINT_DETAIL_FIELDS
} from "./operation.fragments";

/**************************************************************************** */
/*************************** BLUEPRINT QUERIES ****************************** */
/**************************************************************************** */

export const RETRIEVE_OPERATION_BLUEPRINTS = gql`
    ${BLUEPRINT_SUMMARY_FIELDS}

    query gqlRetrieveOperationBlueprints($divisionId: ID, $type: OperationType) {
        data: gqlRetrieveOperationBlueprints(divisionId: $divisionId, type: $type) {
            ...BlueprintSummaryFields
        }
    }
`;

export const RETRIEVE_OPERATION_BLUEPRINT_BY_ID = gql`
    ${BLUEPRINT_DETAIL_FIELDS}

    query gqlRetrieveOperationBlueprintById($id: ID!, $versionId: ID) {
        data: gqlRetrieveOperationBlueprintById(id: $id, versionId: $versionId) {
            ...BlueprintDetailFields
        }
    }
`;