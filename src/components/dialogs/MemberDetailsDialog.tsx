import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  MessageSquare,
  MapPin, 
  UserCheck, 
  Calendar,
  Smartphone,
  Users,
  IdCard,
  ArrowLeft,
  Copy
} from "lucide-react";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import { openTeamsChat, formatBirthDate, openEditPicture, openEmailClient, SAP_PEOPLE_BASE_URL, copyToClipboard, formatPhoneNumber } from "@/utils/member-utils";
import { TeamsIcon } from "../icons/TeamsIcon";

// Extended member interface with additional fields for the details dialog
export interface ExtendedMember extends DutyMember {
  phoneNumber?: string;
  room?: string;
  managerName?: string;
  birthDate?: string; // Format: MM-DD (no year)
}

interface MemberDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ExtendedMember | null;
  onViewManager?: (managerName: string) => void;
  onGoBack?: () => void;
  showBackButton?: boolean;
}


export function MemberDetailsDialog({ open, onOpenChange, member, onViewManager, onGoBack, showBackButton }: MemberDetailsDialogProps) {
  if (!member) return null;

  const detailItems = [
    {
      icon: IdCard,
      label: "User ID",
      value: member.id,
      isCopyable: true
    },
    {
      icon: Mail,
      label: "Email",
      value: member.email,
      isCopyable: true
    },
    {
      icon: Users,
      label: "Team",
      value: member.team || "Not specified"
    },
    {
      icon: MapPin,
      label: "Room",
      value: member.room || "Not specified"
    },
    {
      icon: UserCheck,
      label: "Manager Name",
      value: member.managerName || "Not specified",
      onClick: member.managerName && member.managerName !== "Not specified" && onViewManager 
        ? () => onViewManager(member.managerName!) 
        : undefined
    },
    {
      icon: Calendar,
      label: "Birth Date",
      value: formatBirthDate(member.birthDate) || "Not specified"
    },
    {
      icon: Smartphone,
      label: "Mobile Phone",
      value: formatPhoneNumber(member.mobile)
    }
  ];

  const MAP_ROLE_TO_LABEL: Record<string, string> = {
  'member': "Member",
  'manager': "Manager",
  'scm': "SCM",
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {showBackButton && onGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGoBack}
                className="h-8 w-8 p-0"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>
                View detailed information about this team member
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Header */}
          <div className="flex items-center gap-4">
            <Avatar 
              className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => openEditPicture(member.id)}
            >
              <AvatarImage src={`${SAP_PEOPLE_BASE_URL}/avatar/${member.id}`} alt={`${member.fullName} avatar`} />
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{member.fullName}</h3>
              <Badge variant="secondary" className="mt-1">{MAP_ROLE_TO_LABEL[member.role] || member.role}</Badge>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openTeamsChat(member.email)}
              className="flex items-center gap-2"
            >
              <TeamsIcon className="h-6 w-6" />
              Open Teams Chat
            </Button>
            {member.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEmailClient(member.email)}
                className="flex items-center gap-2"
              >
                <img src="/outlook-icon.png" alt="Outlook" className="h-6 w-6" />
                Send Email
              </Button>
            )}
          </div>


          {/* Member Details */}
          <div className="space-y-3">
            <div className="grid gap-1">
              {detailItems.map((item, index) => {
                const isClickable = !!item.onClick;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 p-2 rounded-md ${
                      isClickable ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
                    }`}
                    onClick={item.onClick}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground min-w-0">
                      {item.label}:
                    </span>
                    <span 
                      className={`text-sm truncate flex-1 ${
                        isClickable ? 'text-primary hover:underline' : ''
                      }`} 
                      title={item.value}
                    >
                      {item.value}
                    </span>
                    {item.isCopyable && item.value && item.value !== "Not specified" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => copyToClipboard(e, item.value)}
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        aria-label={`Copy ${item.label}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
