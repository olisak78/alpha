import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

interface ProfileCardProps {
  user?: {
    picture?: string;
    name?: string;
    email?: string;
  };
  me: {
    avatar?: string;
    role: string;
  };
  displayName: string;
  displayEmail: string;
  isOnDuty: boolean;
  isOnCall: boolean;
}

export default function ProfileCard({ 
  user, 
  me, 
  displayName, 
  displayEmail, 
  isOnDuty, 
  isOnCall 
}: ProfileCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.picture || me.avatar || undefined} alt={`${displayName} avatar`} />
          <AvatarFallback>{initials(displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{displayName}</div>
          <div className="text-sm text-muted-foreground">{displayEmail} • {me.role}</div>
          <div className="mt-2 flex gap-2">
            {isOnDuty && <Badge variant="default">On Duty Today</Badge>}
            {isOnCall && <Badge variant="secondary">On Call Tonight</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
