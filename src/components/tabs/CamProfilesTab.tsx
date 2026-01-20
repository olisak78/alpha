import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter profiles based on search query
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return camGroups;
    const query = searchQuery.toLowerCase();
    return camGroups.filter(profile =>
      profile.name.toLowerCase().includes(query) ||
      profile.group?.toLowerCase().includes(query) ||
      profile.description?.toLowerCase().includes(query)
    );
  }, [camGroups, searchQuery]);

  // Group profiles by their group property
  const groupedProfiles = groupProfilesBy(filteredProfiles, (profile) => profile.group || 'Other');

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
       <div key={profile.name} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{profile.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{type}</div>
        </div>
        <button
          onClick={() => handleRequest(profile.name)}
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Request access"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
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

  const totalProfiles = filteredProfiles.length;

  return (
    <div className="flex flex-col space-y-4 px-6 pt-4 pb-6 min-h-[400px]">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search profiles by name, group, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {searchQuery && (
          <span>Found {totalProfiles} profile{totalProfiles !== 1 ? 's' : ''}</span>
        )}
        {!searchQuery && (
          <span>Showing {totalProfiles} profile{totalProfiles !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Profiles List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedProfiles).length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No profiles found matching "{searchQuery}"
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-3">
            {Object.entries(groupedProfiles).map(([groupName, profiles], gi) => {
              const sectionedProfiles = groupProfilesBySection(profiles);

              return (
                <AccordionItem key={groupName} value={`grp-${gi}`} className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors [&[data-state=open]]:bg-slate-50 dark:[&[data-state=open]]:bg-slate-700/50">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{groupName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {sections.map(({ key, label }) => {
                        const sectionProfiles = sectionedProfiles[key];
                        if (!sectionProfiles || sectionProfiles.length === 0) return null;

                        return (
                          <div key={key} className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-1">
                              {label} ({sectionProfiles.length})
                            </h4>
                            <div className="space-y-2">
                              {sectionProfiles.map(renderProfileCard)}
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
        )}
      </div>
    </div>
  );
}
