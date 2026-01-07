import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface WorkspaceContextType {
  currentWorkspaceId: number | null;
  setCurrentWorkspaceId: (id: number | null) => void;
  workspaces: any[];
  isLoading: boolean;
  refetchWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(() => {
    const saved = localStorage.getItem("currentWorkspaceId");
    return saved ? parseInt(saved) : null;
  });

  const { data: workspaces = [], isLoading, refetch } = trpc.workspace.list.useQuery(undefined, {
    retry: false,
  });

  // Save current workspace ID to localStorage
  useEffect(() => {
    if (currentWorkspaceId !== null) {
      localStorage.setItem("currentWorkspaceId", currentWorkspaceId.toString());
    } else {
      localStorage.removeItem("currentWorkspaceId");
    }
  }, [currentWorkspaceId]);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && currentWorkspaceId === null) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, isLoading, currentWorkspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        setCurrentWorkspaceId,
        workspaces,
        isLoading,
        refetchWorkspaces: refetch,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
