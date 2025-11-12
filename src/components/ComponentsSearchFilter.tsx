import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentsSearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
}

export const ComponentsSearchFilter = ({
  searchTerm,
  setSearchTerm,
  placeholder = "Search components"
}: ComponentsSearchFilterProps) => {
  return (
    <div className="relative flex-shrink min-w-[150px] w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 h-9"
      />
    </div>
  );
};
