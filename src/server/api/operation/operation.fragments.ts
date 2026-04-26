import {
    gql
} from "@apollo/client";

export const BLUEPRINT_SUMMARY_FIELDS = gql`
    fragment BlueprintSummaryFields on OperationBlueprint {
        id
        title
        description
        type
        subType

        divisionId
        division {
            id
            name
            code
        }

        status
        updatedAt

        createdBy {
            id
            firstName
            lastName
        }

        steps {
            id
        }

        prerequisites {
            id
            requiredBlueprintId
            requiredBlueprint {
                id
                title
                type
                subType
            }
        }
    }
`;

export const BLUEPRINT_DETAIL_FIELDS = gql`
    fragment BlueprintDetailFields on OperationBlueprint {
        id
        title
        description
        type
        subType

        divisionId
        division {
            id
            name
            code
        }

        status
        createdAt
        updatedAt

        createdById
        createdBy {
            id
            firstName
            lastName
        }

        maxGlobalOperations

        steps {
            id
            blueprintId
            title
            description
            sortOrder

            isBlocking
            isRequired
            allowDocumentUpload

            stepType
            waitForLinkedType
            openBlueprintIds
            conditionalVisibility
            allowInstanceLink
            notificationPersons
            expectedDocuments

            position

            fileTemplates {
                id
                templateId
                allowMultipleFills
                isOptional
                template {
                    id
                    title
                }
            }
        }

        edges {
            id
            blueprintId
            sourceId
            targetId
            label
            conditionType
        }

        prerequisites {
            id
            requiredBlueprintId
            requiredBlueprint {
                id
                title
                type
                subType
            }
        }
    }
`;

export const INSTANCE_SUMMARY_FIELDS = gql`
    fragment InstanceSummaryFields on OperationInstance {
        id
        title
        description
        code

        blueprintId
        blueprint {
            id
            title
            type
            subType
            maxGlobalOperations
        }

        officeId
        office {
            id
            name
            code
        }

        divisionId
        division {
            id
            name
        }

        status
        updatedAt

        createdBy {
            id
            firstName
            lastName
        }

        assignedTo {
            id
            firstName
            lastName
        }

        stepInstances {
            id
            status
        }

        sourceLinks {
            id
            linkType
        }

        targetLinks {
            id
            linkType
        }
    }
`;

export const INSTANCE_DETAIL_FIELDS = gql`
    fragment InstanceDetailFields on OperationInstance {
        id
        title
        description
        code

        blueprintId
        blueprint {
            id
            title
            type
            subType
            prerequisites {
                id
                requiredBlueprintId
                requiredBlueprint {
                    id
                    title
                    type
                    subType
                }
            }
        }

        officeId
        office {
            id
            name
            code
        }

        divisionId
        division {
            id
            name
            code
        }

        status
        createdAt
        updatedAt

        createdById
        createdBy {
            id
            firstName
            lastName
        }

        assignedToId
        assignedTo {
            id
            firstName
            lastName
        }

        requestedById
        requestedBy {
            id
            firstName
            lastName
        }

        launchedFromInstanceId
        launchedFromInstance {
            id
            title
            code
        }

        stepInstances {
            id
            instanceId
            stepId
            step {
                id
                title
                description
                sortOrder
                isBlocking
                isRequired
                allowDocumentUpload
                stepType
                waitForLinkedType
                openBlueprintIds
                openBlueprints {
                    id
                    title
                }
                conditionalVisibility
                allowInstanceLink
                notificationPersons
                expectedDocuments
                position
                fileTemplates {
                    id
                    templateId
                    allowMultipleFills
                    isOptional
                    template {
                        id
                        title
                    }
                }
            }
            status
            completedAt
            selectedEdgeId
            checkedDocuments
            notifiedPersons
            documents {
                id
                fileName
                fileUrl
                fileSize
                mimeType
                createdAt
            }
            formInstances {
                id
                formInstanceId
                formInstance {
                    id
                    status
                    updatedAt
                    templateVersionId
                    templateVersion {
                        templateId
                    }
                }
            }
        }

        sourceLinks {
            id
            linkType
            targetInstanceId
            targetInstance {
                id
                title
                code
                status
                blueprintId
            }
        }

        targetLinks {
            id
            linkType
            sourceInstanceId
            sourceInstance {
                id
                title
                code
                status
            }
        }
    }
`;

export const API_OPERATION_RESPONSE = gql`
    fragment OperationApiResponse on ApiResponse {
        success
        message
        errors {
            field
            message
        }
    }
`;
