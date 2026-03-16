import { useContext } from "react";
import {
  OperationStateContext,
  OperationDispatchContext,
} from "../context/operation-context";

export function useOperationState() {
  return useContext(OperationStateContext);
}

export function useOperationDispatch() {
  return useContext(OperationDispatchContext);
}

export function useOperation(id: string | undefined) {
  const { operations } = useOperationState();
  return operations.find((op) => op.id === id);
}
