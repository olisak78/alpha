import { useState, useCallback, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchDropdownProps<T> {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  isDropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  items?: T[];
  onItemSelect: (item: T) => void;
  renderItem: (item: T) => ReactNode;
  getItemKey: (item: T) => string;
  noResultsMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
}

export function SearchDropdown<T>({
  searchTerm,
  onSearchTermChange,
  isDropdownOpen,
  onDropdownOpenChange,
  placeholder = "Search...",
  className = "",
  isLoading = false,
  error = null,
  items = [],
  onItemSelect,
  renderItem,
  getItemKey,
  noResultsMessage = "No results found",
  loadingMessage = "Searching...",
  errorMessage = "Error occurred. Please try again."
}: SearchDropdownProps<T>) {
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchTermChange(value);
  }, [onSearchTermChange]);

  const handleClearSearch = useCallback(() => {
    onSearchTermChange("");
    onDropdownOpenChange(false);
  }, [onSearchTermChange, onDropdownOpenChange]);

  const handleInputFocus = useCallback(() => {
    if (searchTerm.trim().length > 0) {
      onDropdownOpenChange(true);
    }
  }, [searchTerm, onDropdownOpenChange]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow for click events on dropdown items
    setTimeout(() => {
      onDropdownOpenChange(false);
    }, 200);
  }, [onDropdownOpenChange]);

  const handleItemSelect = useCallback((item: T) => {
    onItemSelect(item);
    onDropdownOpenChange(false);
  }, [onItemSelect, onDropdownOpenChange]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-10 h-9"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-sm text-muted-foreground">
              {loadingMessage}
            </div>
          )}
          
          {error && (
            <div className="p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          
          {items && items.length > 0 ? (
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={getItemKey(item)}
                  onClick={() => handleItemSelect(item)}
                  className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors"
                >
                  {renderItem(item)}
                </button>
              ))}
            </div>
          ) : (
            !isLoading && !error && searchTerm && (
              <div className="p-3 text-sm text-muted-foreground">
                {noResultsMessage}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
