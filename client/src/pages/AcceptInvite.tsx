import { useState, useEffect } from "react";
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
import { Loader2, UserPlus } from "lucide-react";

export function AcceptInvite() {
  const [location, navigate] = useLocation();
  
  const inviteCode = new URLSearchParams(location.split("?")[1] || "").get("code") || "";
  
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("dicebear:avataaars:partner-b");
  const [income, setIncome] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const acceptInviteMutation = trpc.workspace.acceptInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation accepted! Welcome to the workspace.");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept invitation");
    },
  });

  useEffect(() => {
    if (!inviteCode) {
      toast.error("Invalid invitation link");
      navigate("/");
    }
  }, [inviteCode, navigate]);

  const handleAccept = () => {
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }

    acceptInviteMutation.mutate({
      inviteCode,
      displayName,
      avatar,
      income,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Join Workspace
          </h1>
          <p className="text-muted-foreground">
            You've been invited to share expenses together
          </p>
        </div>

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
              placeholder="e.g., Jordan"
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

          <Button
            onClick={handleAccept}
            disabled={acceptInviteMutation.isPending}
            className="w-full"
          >
            {acceptInviteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </div>

        {showAvatarPicker && (
          <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Your Avatar</DialogTitle>
              </DialogHeader>
              <AvatarPicker
                currentSeed={(() => {
                  const parsed = parseAvatarUrl(avatar);
                  return parsed.isDiceBear && parsed.seed ? parsed.seed : "partner-b";
                })()}
                currentStyle={(() => {
                  const parsed = parseAvatarUrl(avatar);
                  return parsed.isDiceBear && parsed.style ? parsed.style : "avataaars";
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
