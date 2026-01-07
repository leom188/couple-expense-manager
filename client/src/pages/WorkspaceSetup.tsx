import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarPicker } from "@/components/AvatarPicker";
import { parseAvatarUrl } from "@/components/DiceBearAvatar";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function WorkspaceSetup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"workspace" | "profile">("workspace");
  
  // Workspace details
  const [workspaceName, setWorkspaceName] = useState("");
  const [currency, setCurrency] = useState("$");
  
  // Profile details
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("dicebear:adventurer:partner-a");
  const [income, setIncome] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const createWorkspaceMutation = trpc.workspace.create.useMutation({
    onSuccess: () => {
      toast.success("Workspace created successfully!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create workspace");
    },
  });

  const handleWorkspaceNext = () => {
    if (!workspaceName.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    setStep("profile");
  };

  const handleCreateWorkspace = () => {
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }

    createWorkspaceMutation.mutate({
      name: workspaceName,
      currency,
      myDisplayName: displayName,
      myAvatar: avatar,
      myIncome: income,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to SharedWallet
          </h1>
          <p className="text-muted-foreground">
            {step === "workspace" ? "Create your shared expense workspace" : "Set up your profile"}
          </p>
        </div>

        {step === "workspace" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Our Home, Smith Family"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input
                id="currency"
                placeholder="$"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={10}
              />
            </div>

            <Button onClick={handleWorkspaceNext} className="w-full">
              Next
            </Button>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <ProfileAvatar avatarUrl={avatar} name="You" size={80} />
              <Button variant="outline" onClick={() => setShowAvatarPicker(true)}>
                Change Avatar
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Your Display Name</Label>
              <Input
                id="display-name"
                placeholder="e.g., Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income">Monthly Income (Optional)</Label>
              <Input
                id="income"
                type="number"
                placeholder="0"
                value={income || ""}
                onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Used for income-based split calculations
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("workspace")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                disabled={createWorkspaceMutation.isPending}
                className="flex-1"
              >
                {createWorkspaceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </div>
          </div>
        )}

        {showAvatarPicker && (
          <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Your Avatar</DialogTitle>
              </DialogHeader>
              <AvatarPicker
                currentSeed={(() => {
                  const parsed = parseAvatarUrl(avatar);
                  return parsed.isDiceBear && parsed.seed ? parsed.seed : "partner-a";
                })()}
                currentStyle={(() => {
                  const parsed = parseAvatarUrl(avatar);
                  return parsed.isDiceBear && parsed.style ? parsed.style : "adventurer";
                })()}
                onSelect={(newAvatar) => {
                  setAvatar(newAvatar);
                  setShowAvatarPicker(false);
                }}
                partnerName="You"
              />
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </div>
  );
}
