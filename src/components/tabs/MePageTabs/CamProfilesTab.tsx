import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type RoleType = "Viewer" | "Basic" | "Full" | "Admin" | "Other" | "Approver";
type SectionType = "staging" | "canary" | "hotfix" | "live" | "other";

interface CamProfile {
  name: string;
  description?: string;
  group?: string;
}

interface CamProfilesTabProps {
  camGroups: CamProfile[];
}

function roleType(name: string): RoleType {
  const n = name.toLowerCase();
  if (n.includes("admin")) return "Admin";
  if (n.includes("approver")) return "Approver";
  if (n.includes("viewer")) return "Viewer";
  if (n.includes("basic")) return "Basic";
  if (n.includes("full")) return "Full";
  return "Other";
}

function getProfileSection(name: string): SectionType {
  const n = name.toLowerCase();
  if (n.includes("staging") || n.includes("stage")) return "staging";
  if (n.includes("canary")) return "canary";
  if (n.includes("hotfix") || n.includes("hot-fix")) return "hotfix";
  if (n.includes("live") || n.includes("prod") || n.includes("production")) return "live";
  return "other";
}

const typeStyles: Record<RoleType, string> = {
  Admin: "border-accent/40 bg-accent/10",
  Full: "border-primary/50 bg-primary/20",
  Basic: "border-primary/30 bg-primary/10",
  Viewer: "border-primary/20 bg-primary/5",
  Approver: "border-accent/40 bg-accent/10",
  Other: "border-border bg-background",
};

export default function CamProfilesTab({ camGroups }: CamProfilesTabProps) {
  const handleRequest = (profileName: string) => {
    window.open(`https://cam.int.sap/cam/ui/admin?item=request&profile=${profileName}`, '_blank');
  };

  // Generic function to group profiles by a key function
  const groupProfilesBy = <T extends string>(
    profiles: CamProfile[],
    keyFn: (profile: CamProfile) => T
  ): Record<T, CamProfile[]> => {
    return profiles.reduce((acc, profile) => {
      const key = keyFn(profile);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(profile);
      return acc;
    }, {} as Record<T, CamProfile[]>);
  };

  // Group profiles by their group property
  const groupedProfiles = groupProfilesBy(camGroups, (profile) => profile.group || 'Other');

  // Define section order and labels
  const sections = [
    { key: 'staging', label: 'Staging' },
    { key: 'canary', label: 'Canary' },
    { key: 'hotfix', label: 'Hotfix' },
    { key: 'live', label: 'Live' },
    { key: 'other', label: 'Other' }
  ] as const;

  // Function to group profiles by section within a group
  const groupProfilesBySection = (profiles: CamProfile[]) =>
    groupProfilesBy(profiles, (profile) => getProfileSection(profile.name));

  // Function to group profiles by role type within a section
  const groupProfilesByRoleType = (profiles: CamProfile[]) =>
    groupProfilesBy(profiles, (profile) => roleType(profile.name));

  // Define role type order for consistent display
  const roleTypeOrder:readonly RoleType[] = ['Admin', 'Approver', 'Full', 'Basic', 'Viewer', 'Other'] as const;

  // Function to render profile card
  const renderProfileCard = (profile: CamProfile) => {
    const type = roleType(profile.name);
    return (
       <div key={profile.name} className={`flex items-center justify-between gap-2 rounded-md border p-3 ${typeStyles[type]}`}>
        <div className="flex-1">
          <div className="text-sm font-medium">{profile.name}</div>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => handleRequest(profile.name)}                            
        >
          Request
        </Button>
      </div>
    );
  };

  // Function to render role groups within a section
  const renderRoleGroups = (sectionProfiles: CamProfile[]) => {
    const roleGroups = groupProfilesByRoleType(sectionProfiles);
    return roleTypeOrder.map(roleKey => {
      const roleProfiles = roleGroups[roleKey];
      if (!roleProfiles || roleProfiles.length === 0) return null;
      
      return (
        <div key={roleKey} className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
            {roleKey}
          </h5>
          <div className="space-y-2 pl-2">
            {roleProfiles.map(renderProfileCard)}
          </div>
        </div>
      );
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
      <CardTitle className="text-base">CAM Profiles</CardTitle>
      <p className="text-sm text-muted-foreground">
        Find and request CAM profiles to access different system environments
      </p>
    </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden space-y-4 p-6 bg-muted/30">
        <div className="flex-1 overflow-y-auto">
          <Accordion type="multiple" className="w-full space-y-4">
          {Object.entries(groupedProfiles).map(([groupName, profiles], gi) => {
            const sectionedProfiles = groupProfilesBySection(profiles);
            
            return (
              <AccordionItem key={groupName} value={`grp-${gi}`} className="border-0 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 bg-background overflow-hidden">
                <AccordionTrigger className="text-left py-5 px-6 hover:bg-accent/10 transition-all duration-200 hover:no-underline data-[state=open]:bg-accent/15">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-base font-semibold">{groupName}</span>
                    <span className="text-sm text-muted-foreground font-normal mr-2">
                      ({profiles.length} profiles)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map(({ key, label }) => {
                      const sectionProfiles = sectionedProfiles[key];
                      if (!sectionProfiles || sectionProfiles.length === 0) return null;
                      
                      return (
                        <div key={key}>
                          <div className="rounded-md border p-3 bg-muted/20 min-h-[100px]">
                            <h4 className="text-xs font-bold text-muted-foreground tracking-wide text-left mb-3">
                              {label}
                            </h4>
                            <div className="space-y-3">
                              {renderRoleGroups(sectionProfiles)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
