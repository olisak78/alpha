import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect, useRef, memo } from 'react';
import { useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
}

export const SearchInput = memo(function SearchInput({ placeholder = "Search alerts..." }: SearchInputProps) {
  const { filters, actions } = useTriggeredAlertsContext();
  const [localValue, setLocalValue] = useState(filters.searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when context search term changes (e.g., when filters are reset)
  useEffect(() => {
    setLocalValue(filters.searchTerm);
  }, [filters.searchTerm]);

  // Function to handle debounced search term updates
  const handleDebouncedSearchUpdate = (debouncedValue: string) => {
    if (debouncedValue !== filters.searchTerm) {
      actions.setSearchTerm(debouncedValue);
    }
  };

  // Debounced update to context using the custom hook
  useDebounce(localValue, handleDebouncedSearchUpdate, { delay: 800 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          className="pl-10 h-10"
        />
      </div>
    </div>
  );
});
