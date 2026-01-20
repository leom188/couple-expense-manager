import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Trash2, Settings as SettingsIcon } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { InvitationManager } from "./InvitationManager";

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CURRENCY_OPTIONS = [
  { value: "$", label: "$ (USD)" },
  { value: "€", label: "€ (EUR)" },
  { value: "£", label: "£ (GBP)" },
  { value: "¥", label: "¥ (JPY/CNY)" },
  { value: "₹", label: "₹ (INR)" },
  { value: "₽", label: "₽ (RUB)" },
  { value: "R$", label: "R$ (BRL)" },
  { value: "₩", label: "₩ (KRW)" },
  { value: "A$", label: "A$ (AUD)" },
  { value: "C$", label: "C$ (CAD)" },
];

export function WorkspaceSettingsDialog({ open, onOpenChange }: WorkspaceSettingsDialogProps) {
  const { workspaces, currentWorkspaceId } = useWorkspace();
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);
  
  const [name, setName] = useState(currentWorkspace?.name || "");
  const [currency, setCurrency] = useState(currentWorkspace?.currency || "$");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const utils = trpc.useUtils();

  // Update workspace
  const updateMutation = trpc.workspace.update.useMutation({
    onSuccess: () => {
      toast.success("Workspace updated successfully!");
      utils.workspace.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update workspace: ${error.message}`);
    },
  });

  // Delete workspace
  const deleteMutation = trpc.workspace.delete.useMutation({
    onSuccess: () => {
      toast.success("Workspace deleted successfully!");
      utils.workspace.list.invalidate();
      onOpenChange(false);
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete workspace: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!currentWorkspaceId) return;
    
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    updateMutation.mutate({
      workspaceId: currentWorkspaceId,
      name: name.trim(),
      currency,
    });
  };

  const handleDelete = () => {
    if (!currentWorkspaceId) return;
    
    deleteMutation.mutate({
      workspaceId: currentWorkspaceId,
    });
  };

  // Update local state when workspace changes
  if (currentWorkspace && (name !== currentWorkspace.name || currency !== currentWorkspace.currency)) {
    setName(currentWorkspace.name);
    setCurrency(currentWorkspace.currency);
  }

  if (!currentWorkspace) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Workspace Settings
            </DialogTitle>
            <DialogDescription>
              Manage settings for {currentWorkspace.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={updateMutation.isPending}>
                  <SelectTrigger id="workspace-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4 mt-4">
              <InvitationManager workspaceId={currentWorkspace.id} />
            </TabsContent>

            <TabsContent value="danger" className="space-y-4 mt-4">
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-2">
                  Delete Workspace
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Once you delete a workspace, there is no going back. All expenses, budgets, and recurring expenses will be permanently deleted.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workspace "{currentWorkspace.name}" and remove all associated data including expenses, budgets, and recurring expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Workspace
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
