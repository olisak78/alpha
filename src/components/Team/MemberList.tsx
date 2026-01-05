import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import { useState } from "react";
import ApprovalDialog from "../dialogs/ApprovalDialog";
import { MoveMemberDialog } from "../dialogs/MoveMemberDialog";
import { MemberDetailsDialog, type ExtendedMember } from "../dialogs/MemberDetailsDialog";
import { TeamColorPicker } from "./TeamColorPicker";
import { MemberCard } from "./MemberCard";
import { useToast } from "@/hooks/use-toast";
import { useTeamContext } from "@/contexts/TeamContext";

interface MemberListProps {
  showActions?: boolean;
  colorPickerProps?: {
    currentColor: string;
    onColorChange: (color: string) => void;
    disabled: boolean;
    usedColors: string[];
  };
}

export function MemberList({ showActions = true, colorPickerProps }: MemberListProps) {
  const { 
    members, 
    teamName, 
    teamOptions, 
    deleteMember, 
    moveMember, 
    openAddMember,
    isAdmin,
    currentTeam
  } = useTeamContext();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isMoveConfirmDialogOpen, setIsMoveConfirmDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<DutyMember | null>(null);
  const [memberToMove, setMemberToMove] = useState<DutyMember | null>(null);
  const [memberToView, setMemberToView] = useState<ExtendedMember | null>(null);
  const [previousMember, setPreviousMember] = useState<ExtendedMember | null>(null);
  const [targetTeam, setTargetTeam] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const managerMember = currentTeam?.members?.find(m => m.team_role === 'manager');
  const manager = managerMember ? `${managerMember.first_name || ''} ${managerMember.last_name || ''}`.trim() : '';

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

  const handleViewDetails = (member: DutyMember) => {
    // Reset navigation state when opening a new member details
    setPreviousMember(null);
    
    // Convert DutyMember to ExtendedMember with sample data for missing fields
    const extendedMember: ExtendedMember = {
      ...member,
      room: "", // Sample data
      managerName:  manager || "N/A",
      birthDate: "", // Sample data (March 15, no year)
    };
    
    setMemberToView(extendedMember);
    setIsDetailsDialogOpen(true);
  };

  const handleViewManager = (managerName: string) => {
    // Store the current member as previous before switching to manager
    setPreviousMember(memberToView);
    
    // Find the manager member by name
    const managerMember = members.find(m => 
      m.fullName.trim() === managerName.trim()
    );
    
    if (managerMember) {
      const extendedManagerMember: ExtendedMember = {
        ...managerMember,
        room: "", // Sample data
        managerName: manager || "N/A",
        birthDate: "", // Sample data
      };
      
      setMemberToView(extendedManagerMember);
    }
  };

  const handleGoBack = () => {
    if (previousMember) {
      setMemberToView(previousMember);
      setPreviousMember(null);
    }
  };

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

      <MemberDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) {
            // Reset navigation state when dialog is closed
            setPreviousMember(null);
          }
        }}
        member={memberToView}
        onViewManager={handleViewManager}
        onGoBack={handleGoBack}
        showBackButton={!!previousMember}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <Badge variant="outline">{members.length}</Badge>
      </div>
       {isAdmin && (
          <div className="flex items-center gap-2 h-9">
            {colorPickerProps && (
              <TeamColorPicker
                currentColor={colorPickerProps.currentColor}
                onColorChange={colorPickerProps.onColorChange}
                disabled={colorPickerProps.disabled}
                usedColors={colorPickerProps.usedColors}
              />
            )}
            <Button size="sm" onClick={openAddMember} className="h-9">
              Add Member
            </Button>
          </div>
        )}
      </div>
      {members.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-left">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
          {members.map((member:DutyMember) => (
            <MemberCard
              key={member.id}
              member={member}
              showActions={showActions}
              isAdmin={isAdmin}
              onInitiateMove={handleInitiateMove}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </section>
  );
}
