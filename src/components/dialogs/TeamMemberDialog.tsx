import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import type { CreateUserRequest } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { validateForm } from "./utils/dialog-helpers";
import { isValidEmail, isValidUrl } from "@/utils/developer-portal-helpers";
import { useTeams } from "@/hooks/api/useTeams";
import { SelectField, TextField } from "./FormField";
import { PLACEHOLDERS } from "@/constants/developer-portal";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useLdapUserSearch } from "@/hooks/api/useMembers";
import type { LdapUser } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

// Extended form data to match CreateUserRequest
interface MemberFormData extends Partial<CreateUserRequest> {
  userId?: string;
  avatar?: string; // For compatibility with existing UI
  team?: string; // For team selection in UI
  fullName?: string; // For compatibility with existing UI
}

// Type alias for setState function
type SetMemberFormFn = (form: MemberFormData | ((prev: MemberFormData) => MemberFormData)) => void;


interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember: DutyMember | null;
  memberForm: MemberFormData;
  teamName?: string;
  setMemberForm: SetMemberFormFn;
  onRemove: (id: string) => void;
  onCreateMember?: (payload: CreateUserRequest) => void;
  }

export function TeamMemberDialog({
  open,
  onOpenChange,
  editingMember,
  memberForm,
  teamName,
  setMemberForm,
  onRemove,
  onCreateMember,
  }: MemberDialogProps) {

  const [userIdValidated, setUserIdValidated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
    const validation = useMemo(() => validateForm(memberForm), [memberForm]);
  const { toast } = useToast();

  // LDAP user search
  const { data: searchResults, isLoading: isSearching, error: searchError } = useLdapUserSearch(
    searchQuery,
    { 
      enabled: searchQuery.trim().length > 3, // Only search when we have at least 4 characters
      refetchOnWindowFocus: false,
    }
  );

  // Fetch teams using the same hook as TeamsPage
  const { data: teamsResponse, isLoading: teamsLoading, error: teamsError } = useTeams({
    page: 1,
    page_size: 100,
  });


  // Track which fields the user has interacted with
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Reset touched fields when dialog opens/closes or when switching between add/edit
  useEffect(() => {
    if (open) {
      setTouchedFields(new Set());
      setSearchQuery('');
      setShowDropdown(false);
      // For editing existing members, consider userId as validated
      setUserIdValidated(!!editingMember);
      // Reset userId validation for new members
      if (!editingMember) {
        setUserIdValidated(false);
      }
    }
  }, [open, editingMember?.id]);

  // Convert teams to dropdown options
  const teamOptions = useMemo(() => {
    if (!teamsResponse?.teams) return [];
    
    return teamsResponse.teams.map(team => ({
      value: team.title || team.name,
      label: team.title || team.name,
    }));
  }, [teamsResponse]);

  const handleSave = () => {
    if (!validation.isValid || (!userIdValidated && !editingMember)) {
      return;
    }

    if (editingMember) {
      // For editing existing members, temporary code until edit implementation
      return;
    }

    // For new members, create the API payload
    const fullName = memberForm.fullName || '';
    const nameParts = fullName.split(',').map(part => part.trim());
    const firstName = nameParts[1] || '';
    const lastName = nameParts[0] || '';

    // Find the selected team ID
    const selectedTeam = teamsResponse?.teams?.find(
      team => team.title === teamName || team.name === teamName
    );

    const createUserPayload: CreateUserRequest = {
      email: memberForm.email || '',
      first_name: firstName,
      id: searchQuery, // The user ID from LDAP search
      last_name: lastName,
      mobile: '', // Not available from current form, could be added later
      team_id: selectedTeam?.id || '',
      team_role: 'member', // Default role
    };

    // Pass the payload up to the parent component
    if (onCreateMember) {
      onCreateMember(createUserPayload);
    }
  };

  const updateField = (field: string, value: string) => {
    setMemberForm(prev => ({ ...prev, [field]: value }));
    // Reset validation when userId changes
    if (field === 'userId') {
      setUserIdValidated(false);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const shouldShowError = (field: string) => {
    if (!touchedFields.has(field)) return false;
    
    if (field === 'userId') {
      return !memberForm.userId?.trim();
    }
    
    return !!validation.errors[field as keyof typeof validation.errors];
  };

  const getErrorMessage = (field: string) => {
    if (field === 'userId') {
      return "User ID is required";
    }
    
    return validation.errors[field as keyof typeof validation.errors];
  };

  const handleUserSelect = (user: LdapUser) => {
    setUserIdValidated(true);
    setShowDropdown(false);
    // Keep the user's name (user ID) in the search field after selection
    setSearchQuery(user.cn);
    
    // Format name as "last name, first name"
    const formattedName = user.sn && user.givenName 
      ? `${user.sn}, ${user.givenName}`
      : user.displayName || user.cn;
    
    // Populate form fields with LDAP user data
    setMemberForm(prev => ({
      ...prev,
      userId: user.cn,
      fullName: formattedName,
      email: user.email || '',
      role: '',
    }));
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(value.trim().length > 0);
    
    if (value.trim().length === 0) {
      setUserIdValidated(false);
    }
  };

  const fieldsDisabled = !userIdValidated && !editingMember;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
          <DialogDescription>
            {editingMember 
              ? "Update the member details below." 
              : "Enter the User ID first to lookup member details. Fields marked with * are required."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* User Search Field - Only show for new members */}
          {!editingMember && (
            <div className="space-y-2">
              <Label htmlFor="userSearch" className="text-sm font-medium">
                Search User *
              </Label>
              <div className="relative">
                <Input
                  id="userSearch"
                  type="text"
                  placeholder="Type user ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  className="w-full"
                />
                
                {/* Search Results Dropdown */}
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {isSearching && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Searching...</span>
                      </div>
                    )}
                    
                    {searchError && (
                      <div className="py-4 text-center text-sm text-destructive">
                        Error searching users: {searchError.message}
                      </div>
                    )}
                    
                    {searchQuery.length > 0 && searchQuery.length <= 3 && !isSearching && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Type at least 4 characters to search
                      </div>
                    )}
                    
                    {!isSearching && !searchError && searchResults?.users && searchResults.users.length === 0 && searchQuery.length > 2 && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No users found for "{searchQuery}"
                      </div>
                    )}
                    
                    {searchResults?.users && searchResults.users.length > 0 && (
                      <div className="py-1">
                        {searchResults.users.map((user, index) => (
                            <div
                              key={user.cn}
                              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="flex flex-col">
                                                                  <span className="font-medium truncate">
                                    {user.displayName || `${user.givenName || ''} ${user.sn || ''}`.trim() || user.cn}
                                  </span>
                                                                  <span className="text-sm text-muted-foreground truncate">
                                  {user.cn} {user.email && `• ${user.email}`}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {shouldShowError('userId') && (
                <p className="text-sm text-destructive">Please select a user</p>
              )}
            </div>
          )}

          {/* Full Name Field */}
          <TextField
            id="fullName"
            label="Full name"
            required
            value={memberForm.fullName || ""}
            onChange={(value) => updateField('fullName', value)}
            onBlur={() => handleFieldBlur('fullName')}
            placeholder={PLACEHOLDERS.FULL_NAME}
            error={getErrorMessage('fullName')}
            showError={shouldShowError('fullName')}
            disabled
          />

          {/* Email Field */}
          <TextField
            id="email"
            label="Email"
            type="email"
            required
            value={memberForm.email || ""}
            onChange={(value) => updateField('email', value)}
            onBlur={() => handleFieldBlur('email')}
            placeholder={PLACEHOLDERS.EMAIL}
            error={getErrorMessage('email')}
            showError={shouldShowError('email')}
            validationMessage="Valid"
            showValidation={!validation.errors.email && memberForm.email ? isValidEmail(memberForm.email) : false}
            disabled
          />

          {/* Team Field  */}
          <SelectField
            id="team"
            label="Team"
            required
            value={memberForm.team || teamName || ""}
            onChange={(value) => updateField('team', value)}
            onBlur={() => handleFieldBlur('team')}
            placeholder={PLACEHOLDERS.TEAM}
            options={teamOptions}
            loading={teamsLoading}
            loadingMessage="Loading teams..."
            emptyMessage="No teams available"
            error={getErrorMessage('team')}
            showError={shouldShowError('team')}
            disabled={fieldsDisabled}
          />

          {/* Info message for disabled fields */}
          {fieldsDisabled && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                💡 Search and select a user above to enable other fields
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          {editingMember && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onRemove(editingMember.id);
                onOpenChange(false);
              }}
            >
              Remove
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!validation.isValid || (!userIdValidated && !editingMember)}
              type="button"
              className="min-w-[80px]"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
