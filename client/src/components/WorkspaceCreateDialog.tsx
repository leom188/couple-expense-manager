import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WorkspaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function WorkspaceCreateDialog({ open, onOpenChange, onSuccess }: WorkspaceCreateDialogProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("$");
  const [displayName, setDisplayName] = useState("");
  const utils = trpc.useUtils();

  const createMutation = trpc.workspace.create.useMutation({
    onSuccess: () => {
      toast.success("Workspace created successfully!");
      utils.workspace.list.invalidate();
      setName("");
      setCurrency("$");
      setDisplayName("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create workspace: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      currency,
      myDisplayName: displayName.trim(),
      myAvatar: "dicebear:adventurer:default",
      myIncome: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Set up a new workspace to track expenses separately
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g., Home Expenses, Vacation Budget"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Your Display Name</Label>
            <Input
              id="display-name"
              placeholder="e.g., Partner A, John"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={createMutation.isPending}>
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
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
