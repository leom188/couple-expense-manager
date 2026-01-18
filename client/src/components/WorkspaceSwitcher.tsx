import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronDown, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceCreateDialog } from "./WorkspaceCreateDialog";

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspaceId, setCurrentWorkspaceId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  if (!currentWorkspace) return null;

  const handleSwitch = (workspaceId: number) => {
    setCurrentWorkspaceId(workspaceId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop: Dropdown Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {currentWorkspace.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentWorkspace.currency} • {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {/* Mobile: Compact Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
          {currentWorkspace.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-slate-900 dark:text-white max-w-[120px] truncate">
          {currentWorkspace.name}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Workspace Selector Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl dark:text-white">Switch Workspace</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <AnimatePresence>
              {workspaces.map((workspace) => {
                const isActive = workspace.id === currentWorkspaceId;
                return (
                  <motion.button
                    key={workspace.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleSwitch(workspace.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all text-left relative",
                      isActive
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {workspace.name}
                          </h3>
                          {isActive && (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <Users size={12} />
                          <span>You as {workspace.myDisplayName}</span>
                          <span>•</span>
                          <span>{workspace.currency}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {/* Create New Workspace Button */}
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
              onClick={() => {
                setIsOpen(false);
                setCreateOpen(true);
              }}
            >
              <Plus size={18} className="mr-2" />
              Create New Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WorkspaceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
