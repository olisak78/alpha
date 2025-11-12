import { useState } from "react";
import { Search, Filter, CheckCircle, CircleDot, ToggleLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureToggle, Landscape } from "@/types/developer-portal";

interface FeatureToggleTabProps {
  featureToggles: FeatureToggle[];
  selectedLandscape: string | null;
  selectedLandscapeName?: string;
  landscapeGroups: Record<string, Landscape[]>;
  expandedToggles: Set<string>;
  toggleFilter: "all" | "all-enabled" | "all-disabled" | "mixed";
  componentFilter: string;
  availableComponents: string[];
  activeProject: string;
  onToggleFeature: (toggleId: string, landscape: string) => void;
  onToggleExpanded: (toggleId: string) => void;
  onBulkToggle: (toggleId: string, group: string, enable: boolean, landscapeGroups: Record<string, Landscape[]>) => void;
  onToggleFilterChange: (filter: "all" | "all-enabled" | "all-disabled" | "mixed") => void;
  onComponentFilterChange: (component: string) => void;
  getFilteredLandscapeIds: (activeProject: string, selectedLandscape: string | null) => string[];
  getProductionLandscapeIds: (activeProject: string) => string[];
  getGroupStatus: (toggle: FeatureToggle, group: string, landscapeGroups: Record<string, Landscape[]>) => { status: string; color: string };
}

export default function FeatureToggleTab({
  featureToggles,
  selectedLandscape,
  selectedLandscapeName,
  landscapeGroups,
  expandedToggles,
  toggleFilter,
  componentFilter,
  availableComponents,
  activeProject,
  onToggleFeature,
  onToggleExpanded,
  onBulkToggle,
  onToggleFilterChange,
  onComponentFilterChange,
  getFilteredLandscapeIds,
  getProductionLandscapeIds,
  getGroupStatus,
}: FeatureToggleTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter toggles based on current filters
  const filteredToggles = featureToggles.filter(toggle => {
    const landscapeIds = getFilteredLandscapeIds(activeProject, selectedLandscape);
    
    // Filter by component if specific component is selected
    if (componentFilter !== "all" && toggle.component !== componentFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !toggle.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !toggle.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (toggleFilter === "all-enabled") {
      return landscapeIds.every(id => toggle.landscapes[id] === true);
    }
    if (toggleFilter === "all-disabled") {
      return landscapeIds.every(id => toggle.landscapes[id] === false);
    }
    if (toggleFilter === "mixed") {
      // For mixed state filter, only consider production landscapes
      const productionIds = getProductionLandscapeIds(activeProject);
      if (productionIds.length === 0) return false;
      const enabledCount = productionIds.filter(id => toggle.landscapes[id] === true).length;
      return enabledCount > 0 && enabledCount < productionIds.length;
    }
    return true; // "all" filter
  });

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Quick Filters:</span>
          <Button 
            variant={toggleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFilterChange("all")}
          >
            All Toggles ({filteredToggles.length})
          </Button>
          <Button 
            variant={toggleFilter === "all-enabled" ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFilterChange("all-enabled")}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            All Enabled ({featureToggles.filter(t => {
              const landscapeIds = getFilteredLandscapeIds(activeProject, selectedLandscape);
              return landscapeIds.every(id => t.landscapes[id] === true);
            }).length})
          </Button>
          <Button 
            variant={toggleFilter === "all-disabled" ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFilterChange("all-disabled")}
          >
            <CircleDot className="h-4 w-4 mr-1" />
            All Disabled ({featureToggles.filter(t => {
              const landscapeIds = getFilteredLandscapeIds(activeProject, selectedLandscape);
              return landscapeIds.every(id => t.landscapes[id] === false);
            }).length})
          </Button>
          <Button 
            variant={toggleFilter === "mixed" ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFilterChange("mixed")}
          >
            <ToggleLeft className="h-4 w-4 mr-1" />
            Mixed State ({featureToggles.filter(t => {
              const productionIds = getProductionLandscapeIds(activeProject);
              if (productionIds.length === 0) return false;
              const enabledCount = productionIds.filter(id => t.landscapes[id] === true).length;
              return enabledCount > 0 && enabledCount < productionIds.length;
            }).length})
          </Button>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-medium">Component:</span>
          <Select value={componentFilter} onValueChange={onComponentFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Components" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Components</SelectItem>
              {availableComponents.map((component) => (
                <SelectItem key={component} value={component}>
                  {component}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feature toggles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="space-y-4">
        {filteredToggles.map((toggle) => {
          const displayLandscapeIds = getFilteredLandscapeIds(activeProject, selectedLandscape);
          
          return (
            <Card key={toggle.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{toggle.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {toggle.component}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{toggle.description}</p>
                    {selectedLandscape && selectedLandscapeName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Filtered by: {selectedLandscapeName}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpanded(toggle.id)}
                    className="flex items-center gap-1"
                  >
                    {expandedToggles.has(toggle.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {expandedToggles.has(toggle.id) ? 'Collapse' : 'Expand'}
                  </Button>
                </div>

                {/* Single Landscape View */}
                {selectedLandscape ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <span className="font-medium">
                        {selectedLandscapeName}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-xs text-muted-foreground">active</span>
                      </div>
                    </div>
                    <Switch
                      checked={toggle.landscapes[selectedLandscape]}
                      onCheckedChange={() => onToggleFeature(toggle.id, selectedLandscape)}
                    />
                  </div>
                ) : (
                  /* Multi-Landscape Compact View */
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(landscapeGroups).map(([groupName, landscapes]) => {
                        const groupStatus = getGroupStatus(toggle, groupName, landscapeGroups);
                        const enabledCount = landscapes.filter(l => toggle.landscapes[l.id]).length;
                        const totalCount = landscapes.length;
                        
                        return (
                          <div key={groupName} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-sm">{groupName}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {enabledCount}/{totalCount} enabled
                                </p>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${groupStatus.color}`} />
                            </div>
                            
                            <div className="flex gap-1 mb-3">
                              {landscapes.slice(0, 8).map((landscape) => (
                                <div
                                  key={landscape.id}
                                  className={`w-2 h-2 rounded-full ${
                                    toggle.landscapes[landscape.id] 
                                      ? 'bg-success' 
                                      : 'bg-muted'
                                  }`}
                                  title={`${landscape.name}: ${toggle.landscapes[landscape.id] ? 'Enabled' : 'Disabled'}`}
                                />
                              ))}
                              {landscapes.length > 8 && (
                                <div className="w-2 h-2 rounded-full bg-muted-foreground opacity-50" title={`+${landscapes.length - 8} more`} />
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs py-1 h-auto"
                                onClick={() => onBulkToggle(toggle.id, groupName, true, landscapeGroups)}
                              >
                                Enable All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs py-1 h-auto"
                                onClick={() => onBulkToggle(toggle.id, groupName, false, landscapeGroups)}
                              >
                                Disable All
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed View */}
                {expandedToggles.has(toggle.id) && !selectedLandscape && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4">Detailed Landscape Controls</h4>
                    <div className="space-y-6">
                      {Object.entries(landscapeGroups).map(([groupName, landscapes]) => (
                        <div key={groupName}>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                              {groupName}
                            </h5>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => onBulkToggle(toggle.id, groupName, true, landscapeGroups)}
                              >
                                Enable All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => onBulkToggle(toggle.id, groupName, false, landscapeGroups)}
                              >
                                Disable All
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {landscapes.map((landscape) => (
                              <div key={landscape.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <span className="font-medium text-sm">{landscape.name}</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-success" />
                                    <span className="text-xs text-muted-foreground">{landscape.status}</span>
                                  </div>
                                </div>
                                <Switch
                                  checked={toggle.landscapes[landscape.id]}
                                  onCheckedChange={() => onToggleFeature(toggle.id, landscape.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
