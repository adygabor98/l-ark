import {
	createContext,
	useReducer,
	type ReactNode,
	type Dispatch,
} from "react";
import type { Operation, Step, StepEdge } from "../types/operation";
import { mockOperations } from "../data/mock-operations";

// --- Action Types ---

type Action =
	| { type: "CREATE_OPERATION"; payload: Operation }
	| { type: "UPDATE_OPERATION"; payload: { id: string; updates: Partial<Omit<Operation, "id">> } }
	| { type: "DELETE_OPERATION"; payload: string }
	| { type: "ADD_STEP"; payload: { operationId: string; step: Step } }
	| { type: "UPDATE_STEP"; payload: { operationId: string; stepId: string; updates: Partial<Omit<Step, "id">> } }
	| { type: "DELETE_STEP"; payload: { operationId: string; stepId: string } }
	| { type: "UPDATE_EDGES"; payload: { operationId: string; edges: StepEdge[] } }
	| { type: "UPDATE_STEPS_AND_EDGES"; payload: { operationId: string; steps: Step[]; edges: StepEdge[] } };

// --- State ---

interface OperationState {
	operations: Operation[];
}

const initialState: OperationState = {
	operations: mockOperations,
};

// --- Reducer ---

function operationReducer(state: OperationState, action: Action): OperationState {
	switch (action.type) {
		case "CREATE_OPERATION":
			return { ...state, operations: [...state.operations, action.payload] };

		case "UPDATE_OPERATION":
			return {
				...state,
				operations: state.operations.map((op) =>
					op.id === action.payload.id
						? { ...op, ...action.payload.updates, updatedAt: new Date().toISOString() }
						: op
				),
			};

		case "DELETE_OPERATION":
			return {
				...state,
				operations: state.operations.filter((op) => op.id !== action.payload),
			};

		case "ADD_STEP": {
			return {
				...state,
				operations: state.operations.map((op) =>
					op.id === action.payload.operationId
						? {
								...op,
								steps: [...op.steps, action.payload.step],
								updatedAt: new Date().toISOString(),
							}
						: op
				),
			};
		}

		case "UPDATE_STEP":
			return {
				...state,
				operations: state.operations.map((op) =>
					op.id === action.payload.operationId
						? {
								...op,
								steps: op.steps.map((s) =>
									s.id === action.payload.stepId ? { ...s, ...action.payload.updates } : s
								),
								updatedAt: new Date().toISOString(),
							}
						: op
				),
			};

		case "DELETE_STEP": {
			const { operationId, stepId } = action.payload;
			return {
				...state,
				operations: state.operations.map((op) =>
					op.id === operationId
						? {
								...op,
								steps: op.steps.filter((s) => s.id !== stepId),
								edges: op.edges.filter((e) => e.source !== stepId && e.target !== stepId),
								updatedAt: new Date().toISOString(),
							}
						: op
				),
			};
		}

		case "UPDATE_EDGES":
			return {
				...state,
				operations: state.operations.map((op) =>
					op.id === action.payload.operationId
						? { ...op, edges: action.payload.edges, updatedAt: new Date().toISOString() }
						: op
				),
			};

		case "UPDATE_STEPS_AND_EDGES":
			return {
				...state,
				operations: state.operations.map((op) =>
					op.id === action.payload.operationId
						? {
								...op,
								steps: action.payload.steps,
								edges: action.payload.edges,
								updatedAt: new Date().toISOString(),
							}
						: op
				),
			};

		default:
			return state;
	}
}

// --- Context ---

export const OperationStateContext = createContext<OperationState>(initialState);
export const OperationDispatchContext = createContext<Dispatch<Action>>(() => {});

// --- Provider ---

export function OperationProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(operationReducer, initialState);

	return (
		<OperationStateContext.Provider value={state}>
			<OperationDispatchContext.Provider value={dispatch}>
				{children}
			</OperationDispatchContext.Provider>
		</OperationStateContext.Provider>
	);
}
