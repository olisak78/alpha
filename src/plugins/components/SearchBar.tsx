import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  debouncedSearchQuery: string;
  filteredTotalItems: number;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  debouncedSearchQuery,
  filteredTotalItems,
}: SearchBarProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search plugins by name, title, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Summary */}
      {debouncedSearchQuery && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Found {filteredTotalItems} {filteredTotalItems === 1 ? 'plugin' : 'plugins'} matching "{debouncedSearchQuery}"
          </span>
          {filteredTotalItems > 0 && (
            <button
              onClick={() => onSearchChange('')}
              className="text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </>
  );
}