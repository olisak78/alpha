import { useState, useEffect, useRef } from "react";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import { useDeleteMember, useUpdateUserTeam, useCreateUser } from "@/hooks/api/mutations/useMemberMutations";
import type { CreateUserRequest, User } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";

interface UseUserManagementProps {
  initialMembers?: DutyMember[];
  onMembersChange?: (members: DutyMember[]) => void;
  onMoveMember?: (member: DutyMember, targetTeam: string) => void;
  teamNameToIdMap?: (teamName: string) => string | undefined;
  currentTeamId?: string; // Add current team ID to ensure proper cache invalidation
}

export function useUserManagement({
  initialMembers = [],
  onMembersChange,
  onMoveMember,
  teamNameToIdMap,
}: UseUserManagementProps) {
  const [members, setMembers] = useState<DutyMember[]>(initialMembers);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DutyMember | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<DutyMember>>({
    fullName: "",
    email: "",
    role: "",
    avatar: "",
    team: ""
  });

  // Get current user data for the user_uuid
  const { memberData: currentUserData } = useAuthWithRole();

  // Toast hook for notifications
  const { toast } = useToast();

  // Use ref to store deleted members for rollback to avoid closure issues
  const deletedMembersRef = useRef<Record<string, { member: DutyMember; originalIndex: number }>>({});
  
  // Use ref to store moved members for rollback to avoid closure issues
  const movedMembersRef = useRef<Record<string, { member: DutyMember; originalIndex: number }>>({});
  
  // Use ref to store created members for rollback to avoid closure issues
  const createdMembersRef = useRef<Record<string, DutyMember>>({});

  // Delete member mutation
  const deleteMemberMutation = useDeleteMember({
    onSuccess: (_, memberId) => {
      // Clear the deleted member from rollback map on success
      delete deletedMembersRef.current[memberId];

      toast({
        title: "Member deleted successfully",
        description: "The team member has been removed from your team.",
      });
    },
    onError: (error, memberId) => {
      // Rollback optimistic update on error
      const rollbackData = deletedMembersRef.current[memberId];
      if (rollbackData) {
        setMembers((prev) => {
          // Insert the member back at its original position
          const restored = [...prev];
          restored.splice(rollbackData.originalIndex, 0, rollbackData.member);
          onMembersChange?.(restored);
          return restored;
        });

        // Clear from rollback map
        delete deletedMembersRef.current[memberId];
      }

      toast({
        variant: "destructive",
        title: "Failed to delete member",
        description: "There was an error removing the member. Please try again.",
      });
    }
  });

  // Move member mutation
  const updateUserMutation = useUpdateUserTeam({
    onSuccess: (data, variables) => {
      // Clear the moved member from rollback map on success
      delete movedMembersRef.current[variables.user_uuid];

      toast({
        title: "Member moved successfully",
        description: `Member has been moved to the new team.`,
      });
    },
    onError: (error, variables) => {
      console.error('Failed to move member:', error);

      // Rollback optimistic update on error
      const rollbackData = movedMembersRef.current[variables.user_uuid];
      if (rollbackData) {
        setMembers((prev) => {
          // Insert the member back at its original position
          const restored = [...prev];
          restored.splice(rollbackData.originalIndex, 0, rollbackData.member);
          onMembersChange?.(restored);
          return restored;
        });

        // Clear from rollback map
        delete movedMembersRef.current[variables.user_uuid];
      }

      toast({
        variant: "destructive",
        title: "Failed to move member",
        description: "There was an error moving the member. Please try again.",
      });
    }
  });

  // Create member mutation
  const createMemberMutation = useCreateUser({
    onSuccess: (data, variables) => {
      // Get the temporary ID used for optimistic update
      const tempId = (variables as CreateUserRequest & { tempId?: string })?.tempId || '';
      
      // Update the member in state with the real data from server
      setMembers((prev) => {
        const updated = prev.map((member) => {
          if (member.id === tempId) {
            // Replace temporary member with real member data
            return {
              id: data.id,
              fullName: `${data.first_name} ${data.last_name}`,
              email: data.email,
              role: "member",
              iuser: (data as User & { iuser?: string }).iuser || "",
            };
          }
          return member;
        });
        onMembersChange?.(updated);
        return updated;
      });
      
      // Clear the created member from rollback map on success
      delete createdMembersRef.current[tempId];

      toast({
        title: "Member created successfully",
        description: `${data.first_name} ${data.last_name} has been added to the team.`,
      });
      
      setMemberDialogOpen(false); // Close the dialog
    },
    onError: (error, variables) => {
      console.error('Failed to create member:', error);

      // Rollback optimistic update on error
      const tempId = (variables as CreateUserRequest & { tempId?: string })?.tempId || '';
      const rollbackMember = createdMembersRef.current[tempId];
      if (rollbackMember) {
        setMembers((prev) => {
          const restored = prev.filter((m) => m.id !== tempId);
          onMembersChange?.(restored);
          return restored;
        });

        // Clear from rollback map
        delete createdMembersRef.current[tempId];
      }

      // Check if user already exists - get the server error message
      const apiError = (error as Error & { apiError?: { message?: string } })?.apiError;
      const errorMessage = apiError?.message || '';
      
      // Check if the error message indicates user already exists
      const lowerErrorMessage = errorMessage.toLowerCase();
      if (lowerErrorMessage.includes('member with this email already exists in the organization')) {
        toast({
          variant: "destructive",
          title: "Member already exists",
          description: "Member already exists in the organization.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to create member",
          description: "There was an error creating the member. Please try again.",
        });
      }
    }
  });

  // Update members when initialMembers prop changes
  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      setMembers(initialMembers);
    }
  }, [initialMembers]);

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ fullName: "", email: "", role: "", avatar: "", team: "" });
    setMemberDialogOpen(true);
  };

  const openEditMember = (member: DutyMember) => {
    setEditingMember(member);
    setMemberForm({ ...member });
    setMemberDialogOpen(true);
  };

  const deleteMember = (id: string) => {
    // Store the member to be deleted for potential rollback
    const memberToDelete = members.find(m => m.id === id);
    if (!memberToDelete) return;

    // Store member and its original index in rollback ref
    const originalIndex = members.findIndex(m => m.id === id);
    deletedMembersRef.current[id] = { member: memberToDelete, originalIndex };

    // Optimistic update: immediately remove from UI
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      onMembersChange?.(next);
      return next;
    });

    // Call the API to delete the member
    deleteMemberMutation.mutate(id);
  };

  const moveMember = (member: DutyMember, targetTeam: string) => {
    // Get the target team ID from the team name using the mapping function
    const targetTeamId = teamNameToIdMap ? teamNameToIdMap(targetTeam) : targetTeam;
    
    if (!targetTeamId) {
      toast({
        variant: "destructive",
        title: "Failed to move member",
        description: "Could not find the target team ID. Please try again.",
      });
      return;
    }

    // Check if the member has a UUID
    if (!member.uuid) {
      toast({
        variant: "destructive",
        title: "Failed to move member",
        description: "Member UUID not available. Please try again.",
      });
      return;
    }
    
    // Store the member and its original index for potential rollback
    // Use the member's UUID as the key since that's what the API uses
    const originalIndex = members.findIndex(m => m.id === member.id);
    movedMembersRef.current[member.uuid] = { member, originalIndex };
    
    // Optimistically remove the member from the current team UI
    const next = members.filter((m) => m.id !== member.id);
    setMembers(next);
    onMembersChange?.(next);
    onMoveMember?.(member, targetTeam);
    
    // Call the API to update the current user's team using UpdateUserTeamRequest format
    updateUserMutation.mutate({
      user_uuid: member.uuid,
      new_team_uuid: targetTeamId
    });
  };

  const createMember = (payload: CreateUserRequest) => {
    // Generate a temporary ID for optimistic update
    const tempId = "temp_" + Date.now();
    
    // Create optimistic member object
    const optimisticMember: DutyMember = {
      id: tempId,
      fullName: `${payload.first_name} ${payload.last_name}`,
      email: payload.email,
      role: payload.team_role || "member",
      iuser: payload.id || "",
      team: payload.team_id || ""
    };

    // Store for potential rollback
    createdMembersRef.current[tempId] = optimisticMember;

    // Optimistic update: immediately add to UI
    setMembers((prev) => {
      const next = [...prev, optimisticMember];
      onMembersChange?.(next);
      return next;
    });

    // Close dialog immediately for better UX
    setMemberDialogOpen(false);

    // Add tempId to CreateUserRequest payload for optimistic update tracking
    const createUserPayload: CreateUserRequest & { tempId: string } = {
      ...payload,
      tempId
    };

    createMemberMutation.mutate(createUserPayload);
  };

  return {
    // State
    members,
    memberDialogOpen,
    setMemberDialogOpen,
    editingMember,
    memberForm,
    setMemberForm,

    // Actions
    openAddMember,
    openEditMember,
    deleteMember,
    moveMember,
    createMember,
  };
}
