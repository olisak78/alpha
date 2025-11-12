import { useState } from "react";
import { Globe, X, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Landscape } from "@/types/developer-portal";

interface LandscapeFilterProps {
  selectedLandscape: string | null;
  landscapeGroups: Record<string, Landscape[]>;
  onLandscapeChange: (landscape: string | null) => void;
  onShowLandscapeDetails: () => void;
  showClearButton?: boolean;
  placeholder?: string;
  showViewAllButton?: boolean;
}

export function LandscapeFilter({
  selectedLandscape,
  landscapeGroups,
  onLandscapeChange,
  onShowLandscapeDetails,
  showClearButton = true,
  showViewAllButton = true,
  placeholder = "Filter by Landscape"
}: LandscapeFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");

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

  // Helper to check if landscape is central
  const isCentralLandscape = (landscape: Landscape) => {
    return (landscape as any).metadata?.['central-region'] === true;
  };

  // Filter landscapes by search term
  const filteredLandscapeGroups = Object.entries(landscapeGroups).reduce((acc, [groupName, landscapes]) => {
    const filtered = landscapes.filter((landscape) => {
      const landscapeName = ((landscape as any).technical_name || landscape.name).toLowerCase();
      return landscapeName.includes(searchTerm.toLowerCase());
    });
    if (filtered.length > 0) {
      acc[groupName] = filtered;
    }
    return acc;
  }, {} as Record<string, Landscape[]>);

  // Check if the selected landscape exists in the current project's landscape list
  const availableLandscapeIds = Object.values(landscapeGroups)
    .flat()
    .map(landscape => landscape.id);

  const isSelectedLandscapeValid = selectedLandscape && availableLandscapeIds.includes(selectedLandscape);

  // Use the selected landscape if valid, otherwise empty string (no selection)
  const selectValue = isSelectedLandscapeValid ? selectedLandscape : "";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectValue}
          onValueChange={(value) => onLandscapeChange(value)}
        >
          <SelectTrigger className={`w-[288px] ${!selectedLandscape ? 'border-red-500 border-2' : ''}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[400px]">
            {/* Search box at the top */}
            <div className="p-2 border-b sticky top-0 bg-background z-10">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search landscapes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Landscape groups with filtered results */}
            {Object.entries(filteredLandscapeGroups).map(([groupName, landscapes]) => (
              <div key={groupName}>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {groupName}
                </div>
                {landscapes.map((landscape) => (
                  <SelectItem key={landscape.id} value={landscape.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(landscape.status)}`} />
                      <span>{(landscape as any).technical_name || landscape.name}</span>
                      {isCentralLandscape(landscape) && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 bg-blue-500 text-white hover:bg-blue-600">
                          central
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}

            {/* No results message */}
            {Object.keys(filteredLandscapeGroups).length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No landscapes found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedLandscape && showClearButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLandscapeChange(null)}
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