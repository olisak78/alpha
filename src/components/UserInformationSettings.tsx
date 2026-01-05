import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface UserInformationSettingsProps {
  fullName: string;
  email: string;
  team: string;
  role: string;
}

export default function UserInformationSettings({
  fullName,
  email,
  team,
  role
}: UserInformationSettingsProps) {

  return (
    <div className="flex flex-col h-full">
      {/* Main Title Section */}
      <div className="mb-6 flex-shrink-0">
        <h3 className="text-lg font-semibold mb-2">User Information</h3>
        <Separator className="mt-4" />
      </div>
      
      {/* User Information Section */}
      <div className="flex flex-col bg-muted/20 rounded-lg p-4 border">
        <div className="flex-shrink-0">
          <h4 className="text-md font-medium mb-2">Personal Details</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Your personal information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="flex items-center">
            <Label className="text-sm font-medium">Full Name:</Label>
            <div className="text-sm text-foreground ml-2">
              {fullName}
            </div>
          </div>

          <div className="flex items-center">
            <Label className="text-sm font-medium">Email:</Label>
            <div className="text-sm text-foreground ml-2">
              {email}
            </div>
          </div>

          <div className="flex items-center">
            <Label className="text-sm font-medium">Team:</Label>
            <div className="text-sm text-foreground ml-2">
              {team}
            </div>
          </div>

          <div className="flex items-center">
            <Label className="text-sm font-medium">Role:</Label>
            <div className="text-sm text-foreground ml-2">
              {role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
