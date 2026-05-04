import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import { useWorkspaceInstance } from "../hooks/useWorkspaceInstance";

type WorkspaceInstanceContextValue = ReturnType<typeof useWorkspaceInstance>;

const WorkspaceInstanceContext = createContext<WorkspaceInstanceContextValue | null>(null);

interface ProviderProps {
	instanceId: number | null;
	children: ReactNode;
}

export const WorkspaceInstanceProvider = ({ instanceId, children }: ProviderProps): ReactElement => {
	const value = useWorkspaceInstance(instanceId);
	return (
		<WorkspaceInstanceContext.Provider value={value}>
			{children}
		</WorkspaceInstanceContext.Provider>
	);
};

export const useWorkspaceInstanceContext = (): WorkspaceInstanceContextValue => {
	const ctx = useContext(WorkspaceInstanceContext);
	if ( !ctx ) throw new Error("useWorkspaceInstanceContext must be used inside WorkspaceInstanceProvider");
	return ctx;
};
