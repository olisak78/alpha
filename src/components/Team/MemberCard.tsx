import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import { MAP_ROLE_TO_LABEL, SAP_PEOPLE_BASE_URL, openTeamsChat, openEmailClient } from "@/utils/member-utils";
import { TeamsIcon } from "../icons/TeamsIcon";

interface MemberCardProps {
  member: DutyMember;
  showActions?: boolean;
  isAdmin?: boolean;
  onInitiateMove?: (member: DutyMember) => void;
  onViewDetails?: (member: DutyMember) => void;
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export function MemberCard({ member, showActions = true, isAdmin = false, onInitiateMove, onViewDetails }: MemberCardProps) {
  const handleTeamsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openTeamsChat(member.email);
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEmailClient(member.email);
  };

  return (
    <Card className="h-fit cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewDetails?.(member)}>
      <CardContent className="flex flex-col gap-2 p-4 relative">
        {showActions && isAdmin && onInitiateMove && (
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Actions">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem onClick={() => onInitiateMove(member)}>
                  Move to...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`${SAP_PEOPLE_BASE_URL}/avatar/${member.id}`} alt={`${member.fullName} avatar`} />
            <AvatarFallback className="text-xs">{initials(member.fullName)}</AvatarFallback>
          </Avatar>
          <h3 className="font-medium text-sm truncate">{member.fullName}</h3>
          {member.role !== 'member' && (
            <Badge variant="secondary" className="w-fit text-xs">{MAP_ROLE_TO_LABEL[member.role] || member.role}</Badge>
          )}
        </div>
        
        {/* Quick Action Buttons - Lower Right Corner */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTeamsClick}
            className="h-7 w-7 p-0 rounded-full hover:bg-accent"
            aria-label="Open Teams Chat"
            title="Open Teams Chat"
          >
            <TeamsIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEmailClick}
            className="h-7 w-7 p-0 rounded-full hover:bg-accent"
            aria-label="Send Email"
            title="Send Email"
          >
            <img src="/outlook-icon.png" alt="Outlook" className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}