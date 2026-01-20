import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Copy, Check, X, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SendInvitationDialog } from "./SendInvitationDialog";

interface InvitationManagerProps {
  workspaceId: number;
}

export function InvitationManager({ workspaceId }: InvitationManagerProps) {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: invitations, isLoading, refetch } = trpc.workspace.listInvitations.useQuery({ workspaceId });
  const cancelMutation = trpc.workspace.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invitation code copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const isExpired = new Date() > new Date(expiresAt);
    
    if (status === "pending" && !isExpired) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
    if (status === "accepted") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
    }
    if (status === "expired" || isExpired) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const pendingInvitations = invitations?.filter(inv => inv.status === "pending" && new Date() <= new Date(inv.expiresAt)) || [];
  const otherInvitations = invitations?.filter(inv => inv.status !== "pending" || new Date() > new Date(inv.expiresAt)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Partner Invitations</h3>
          <p className="text-sm text-slate-500">Invite your partner to collaborate on expenses</p>
        </div>
        <Button onClick={() => setShowSendDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Send Invitation
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Active Invitations</h4>
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} className="border-indigo-100">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {invitation.inviteeEmail ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{invitation.inviteeEmail}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No email specified</span>
                      )}
                      {getStatusBadge(invitation.status, invitation.expiresAt)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                      <div>Partner slot: {invitation.partnerSlot}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <code className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono">
                        {invitation.inviteCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteCode(invitation.inviteCode)}
                        className="shrink-0"
                      >
                        {copiedCode === invitation.inviteCode ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelMutation.mutate({ invitationId: invitation.id })}
                    disabled={cancelMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past Invitations */}
      {otherInvitations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Past Invitations</h4>
          {otherInvitations.map((invitation) => (
            <Card key={invitation.id} className="border-slate-100 opacity-60">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {invitation.inviteeEmail ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{invitation.inviteeEmail}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No email specified</span>
                      )}
                      {getStatusBadge(invitation.status, invitation.expiresAt)}
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      {invitation.status === "accepted" && invitation.acceptedAt && (
                        <span>Accepted on {new Date(invitation.acceptedAt).toLocaleDateString()}</span>
                      )}
                      {invitation.status === "expired" && (
                        <span>Expired on {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                      )}
                      {invitation.status === "cancelled" && (
                        <span>Cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {invitations && invitations.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-slate-500">No invitations yet</CardTitle>
            <CardDescription className="text-center">
              Send an invitation to add your partner to this workspace
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <SendInvitationDialog
        workspaceId={workspaceId}
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSuccess={() => {
          refetch();
          setShowSendDialog(false);
        }}
      />
    </div>
  );
}
