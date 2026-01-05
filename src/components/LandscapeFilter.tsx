import { useState, useMemo } from "react";
import { Globe, X, Info, Clock, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Landscape } from "@/types/developer-portal";
import { getLandscapeHistory, addToLandscapeHistory } from "@/utils/landscapeHistory";
import { sortLandscapeGroups } from "@/utils/developer-portal-helpers";
import { useLandscapeSelection, useSelectedLandscape, useSelectedLandscapeForProject } from "@/stores/appStateStore";
import { cn } from "@/lib/utils";

interface LandscapeFilterProps {
  selectedLandscape?: string | null;
  landscapeGroups: Record<string, Landscape[]>;
  onLandscapeChange: (landscape: string | null) => void;
  onShowLandscapeDetails: () => void;
  showClearButton?: boolean;
  placeholder?: string;
  showViewAllButton?: boolean;
  projectId?: string; // New prop for project-specific landscape selection
  disableNonCentral?: boolean; // Determines if non-central landscapes should be disabled
}

export function LandscapeFilter({
  selectedLandscape: propSelectedLandscape,
  landscapeGroups,
  onLandscapeChange,
  onShowLandscapeDetails,
  showClearButton = true,
  showViewAllButton = true,
  placeholder = "Filter by Landscape",
  projectId,
  disableNonCentral = false
}: LandscapeFilterProps) {
  const [open, setOpen] = useState(false);

  const { getSelectedLandscapeForProject, setSelectedLandscapeForProject } = useLandscapeSelection();
  const globalSelectedLandscape = useSelectedLandscape();

  // Determine which landscape to use
  const projectSelectedLandscape = useSelectedLandscapeForProject(projectId || ''); // Hook, creates subscription!
  const selectedLandscape = projectId ? projectSelectedLandscape : globalSelectedLandscape;

  const frequentlyVisitedGroup = useMemo(() => {
    const history = getLandscapeHistory();
    const allLandscapes = Object.values(landscapeGroups).flat();

    const frequentLandscapes = history
      .map(item => allLandscapes.find(l => l.id === item.id))
      .filter(Boolean) as Landscape[];

    return frequentLandscapes;
  }, [landscapeGroups]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "active":
      case "deployed":
        return "bg-success";
      case "warning":
      case "deploying":
        return "bg-warning";
      case "error":
      case "inactive":
      case "failed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const isCentralLandscape = (landscape: Landscape) => {
    return landscape.isCentral;
  };

  const isLandscapeDisabled = (landscape: Landscape) => {
    // Central landscapes are always enabled
    if (isCentralLandscape(landscape)) return false;
    // Non-central landscapes are disabled only if disableNonCentral is true
    return disableNonCentral;
  };

  const selectedLandscapeObject = useMemo(() => {
    if (!selectedLandscape) return null;
    const allLandscapes = Object.values(landscapeGroups).flat();
    return allLandscapes.find(l => l.id === selectedLandscape);
  }, [selectedLandscape, landscapeGroups]);

  // Prepare grouped landscapes with frequent at top
  const groupedLandscapes = useMemo(() => {
    const groups: Record<string, Landscape[]> = {};

    // Add frequently visited if exists
    if (frequentlyVisitedGroup.length > 0) {
      groups['Frequently Visited'] = frequentlyVisitedGroup;
    }

    // Add all other groups
    Object.entries(landscapeGroups).forEach(([groupName, landscapes]) => {
      groups[groupName] = landscapes;
    });

    return groups;
  }, [landscapeGroups, frequentlyVisitedGroup]);

  const sortedLandscapeGroups = useMemo(() => {
    return sortLandscapeGroups(groupedLandscapes);
  }, [groupedLandscapes]);

  // Check if there are any landscapes available
  const hasLandscapes = useMemo(() => {
    return Object.values(landscapeGroups).some(landscapes => landscapes.length > 0);
  }, [landscapeGroups]);

  const handleLandscapeChange = (value: string) => {
    if (value) {
      addToLandscapeHistory(value);
    }

    // Use project-specific landscape setting if projectId is provided
    if (projectId) {
      setSelectedLandscapeForProject(projectId, value);
    }

    onLandscapeChange(value);
    setOpen(false);
  };

  const handleClear = () => {
    // Use project-specific landscape clearing if projectId is provided
    if (projectId) {
      setSelectedLandscapeForProject(projectId, null);
    }
    onLandscapeChange(null);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-[288px] justify-between",
                !selectedLandscape && hasLandscapes && "border-red-500 border-2"
              )}
            >
              {selectedLandscapeObject ? (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedLandscapeObject.status)}`} />
                  <span className="truncate">
                    {(selectedLandscapeObject as any).technical_name || selectedLandscapeObject.name}
                  </span>
                  {isCentralLandscape(selectedLandscapeObject) && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 bg-blue-500 text-white hover:bg-blue-600">
                      central
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {!hasLandscapes ? "No available landscapes" : placeholder}
                </span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[288px] p-0" align="start">
            {!hasLandscapes ? (
              <div className="p-4 text-center text-muted-foreground">
                No available landscapes
              </div>
            ) : (
              <Command>
                <CommandInput placeholder="Search landscapes..." />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>No landscapes found</CommandEmpty>
                  {sortedLandscapeGroups.map(([groupName, landscapes]) => (
                    <CommandGroup
                      key={groupName}
                      heading={
                        <div className="flex items-center gap-1.5">
                          {groupName === 'Frequently Visited' && <Clock className="h-3 w-3" />}
                          <span className="uppercase">{groupName}</span>
                        </div>
                      }
                    >
                      {landscapes.map((landscape) => {
                        const isCentral = isCentralLandscape(landscape);
                        const isDisabled = isLandscapeDisabled(landscape);
                        const landscapeName = (landscape as any).technical_name || landscape.name;

                        return (
                          <CommandItem
                            key={landscape.id}
                            value={`${landscape.id}-${landscapeName}`}
                            onSelect={() => handleLandscapeChange(landscape.id)}
                            disabled={isDisabled}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLandscape === landscape.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(landscape.status)}`} />
                              <span>{landscapeName}</span>
                              {isCentral && (
                                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 bg-blue-500 text-white hover:bg-blue-600">
                                  central
                                </Badge>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {selectedLandscape && showClearButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {showViewAllButton && (
        <Button
          variant="outline"
          onClick={onShowLandscapeDetails}
          className="flex items-center gap-2"
        >
          <Info className="h-4 w-4" />
          View All Landscapes
        </Button>
      )}
    </div>
  );
}