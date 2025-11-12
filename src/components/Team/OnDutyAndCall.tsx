import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";

interface OnDutyTodayProps {
  dayMember: DutyMember | null;
  nightMember: DutyMember | null;
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export function OnDutyAndCall({ dayMember, nightMember }: OnDutyTodayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">On Duty</CardTitle>
        </CardHeader>
        <CardContent>
          {dayMember ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={dayMember.avatar || undefined} alt={`${dayMember.fullName} avatar`} />
                <AvatarFallback>{initials(dayMember.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{dayMember.fullName}</div>
                <div className="text-sm text-muted-foreground">{dayMember.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Unassigned today</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">On Call</CardTitle>
        </CardHeader>
        <CardContent>
          {nightMember ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={nightMember.avatar || undefined} alt={`${nightMember.fullName} avatar`} />
                <AvatarFallback>{initials(nightMember.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{nightMember.fullName}</div>
                <div className="text-sm text-muted-foreground">{nightMember.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Unassigned today</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
