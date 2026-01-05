import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Users } from "lucide-react";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";

interface MoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: DutyMember | null;
  currentTeam: string;
  teamOptions: string[];
  onMove: (member: DutyMember, targetTeam: string) => void;
  isLoading?: boolean;
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export function MoveMemberDialog({
  open,
  onOpenChange,
  member,
  currentTeam,
  teamOptions,
  onMove,
  isLoading = false
}: MoveMemberDialogProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Reset selection when dialog is closed
  useEffect(() => {
    if (!open) {
      setSelectedTeam("");
    }
  }, [open]);

  const handleMove = () => {
    if (member && selectedTeam) {
      onMove(member, selectedTeam);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTeam(""); // Reset selection when closing
    }
    onOpenChange(newOpen);
  };

  const availableTeams = teamOptions.filter(team => team !== currentTeam);
  const isValid = selectedTeam && availableTeams.includes(selectedTeam);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Move Team Member
          </DialogTitle>
        </DialogHeader>

        {member && (
          <div className="space-y-6 py-4">
            {/* Member Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar || undefined} alt={`${member.fullName} avatar`} />
                <AvatarFallback className="text-sm">{initials(member.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{member.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>

            {/* Move Direction */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">{currentTeam}</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">{selectedTeam || "Select team"}</span>
              </div>
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <Label htmlFor="target-team" className="text-sm font-medium">
                Destination Team
              </Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="target-team">
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.length === 0 ? (
                    <SelectItem value="no-teams" disabled>
                      No other teams available
                    </SelectItem>
                  ) : (
                    availableTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!isValid || isLoading || availableTeams.length === 0}
          >
            {isLoading ? "Moving..." : "Move Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
