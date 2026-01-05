import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ComponentCard from "@/components/ComponentCard";
import { Component } from "@/types/api";

interface ComponentsTabProps {
  components: Component[];
  selectedLandscape: string | null;
  selectedLandscapeName?: string;
  expandedComponents: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  getComponentHealth: (componentId: string, landscape: string | null) => string;
  getComponentAlerts: (componentId: string, landscape: string | null) => boolean;
  system: string; // System parameter is mandatory - components must be under a system
}

export default function ComponentsTab({
  components,
  selectedLandscape,
  selectedLandscapeName,
  expandedComponents,
  onToggleExpanded,
  getComponentHealth,
  getComponentAlerts,
  system,
}: ComponentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (component.description && component.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
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

      <div className="grid gap-6">
        {filteredComponents.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            selectedLandscape={selectedLandscape}
            selectedLandscapeName={selectedLandscapeName}
            expandedComponents={expandedComponents}
            onToggleExpanded={onToggleExpanded}
            getComponentHealth={getComponentHealth}
            getComponentAlerts={getComponentAlerts}
            system={system}
      
          />
        ))}
      </div>
    </div>
  );
}
