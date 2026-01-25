import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProvidersFilterProps {
  showProvidersOnly: boolean;
  onToggle: (show: boolean) => void;
}

/**
 * Filter component to show only provider components
 * Used in CA project to filter components with "provider" in their name/title
 */
export function ProvidersFilter({ showProvidersOnly, onToggle }: ProvidersFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="providers-filter"
        checked={showProvidersOnly}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor="providers-filter"
        className="text-sm font-medium cursor-pointer"
      >
        Show Only Providers
      </Label>
    </div>
  );
}