import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import { useState } from "react";
import ApprovalDialog from "../dialogs/ApprovalDialog";
import { MoveMemberDialog } from "../dialogs/MoveMemberDialog";
import { useToast } from "@/hooks/use-toast";
import { useTeamContext } from "@/contexts/TeamContext";

interface MemberListProps {
  showActions?: boolean;
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export function MemberList({ showActions = true }: MemberListProps) {
  const { 
    members, 
    teamName, 
    teamOptions, 
    deleteMember, 
    moveMember, 
    openAddMember,
    isAdmin 
  } = useTeamContext();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isMoveConfirmDialogOpen, setIsMoveConfirmDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<DutyMember | null>(null);
  const [memberToMove, setMemberToMove] = useState<DutyMember | null>(null);
  const [targetTeam, setTargetTeam] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const confirmRemoveMember = () => {
    if (!memberToRemove) return;

    setIsLoading(true);
    try {
      deleteMember(memberToRemove.id);
      setIsDeleteDialogOpen(false);
      setMemberToRemove(null);
      toast({
        title: "Member removed",
        description: `${memberToRemove.fullName} has been successfully removed from the team.`,
        className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMemberToRemove(null);
  }

  const handleInitiateMove = (member: DutyMember) => {
    if (!showActions || !isAdmin) return;
    setMemberToMove(member);
    setIsMoveDialogOpen(true);
  };

   const handleMoveMemberSelection = (member: DutyMember, selectedTeam: string) => {
    // Store the selection and close the move dialog
    setTargetTeam(selectedTeam);
    setMemberToMove(member);
    setIsMoveDialogOpen(false);
    // Open the confirmation dialog
    setIsMoveConfirmDialogOpen(true);
  };

   const confirmMoveMember = () => {
    if (!memberToMove || !targetTeam) return;

    setIsLoading(true);
    try {
      moveMember(memberToMove, targetTeam);
      setIsMoveConfirmDialogOpen(false);
      setMemberToMove(null);
      setTargetTeam("");
      toast({
        title: "Member moved",
        description: `${memberToMove.fullName} has been successfully moved to ${targetTeam}.`,
        className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
      });
    } catch (error) {
      console.error("Failed to move member:", error);
      toast({
        variant: "destructive",
        title: "Move Failed",
        description: "Failed to move member. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancelMove = () => {
    setIsMoveConfirmDialogOpen(false);
    setMemberToMove(null);
    setTargetTeam("");
  }

  return (
    <section className="mr-6">
      <ApprovalDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        action="delete"
        name={memberToRemove?.fullName || ''}
        onConfirm={confirmRemoveMember}
        onCancel={handleCancelDelete}
        isLoading={isLoading}
      />
         <ApprovalDialog
        open={isMoveConfirmDialogOpen}
        onOpenChange={setIsMoveConfirmDialogOpen}
        action="move"
        name={memberToMove?.fullName || ''}
        moveFrom={teamName}
        moveTo={targetTeam}
        onConfirm={confirmMoveMember}
        onCancel={handleCancelMove}
        isLoading={isLoading}
      />

      <MoveMemberDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        member={memberToMove}
        currentTeam={teamName}
        teamOptions={teamOptions}
        onMove={handleMoveMemberSelection}
        isLoading={false}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <Badge variant="outline">{members.length}</Badge>
      </div>
       {isAdmin && (
          <Button size="sm" onClick={openAddMember}>
            Add Member
          </Button>
        )}
      </div>
      {members.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-left">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={m.avatar || undefined} alt={`${m.fullName} avatar`} />
                    <AvatarFallback>{initials(m.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{m.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                {showActions && isAdmin && (
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        <DropdownMenuItem onClick={() => handleInitiateMove(m)}>
                          Move to...
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Role: {m.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
