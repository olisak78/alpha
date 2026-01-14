import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserSearch } from "@/hooks/api/useMembers";
import { SearchDropdown } from "@/components/SearchDropdown";
import type { User } from "@/types/api";

interface SearchUserProps {
  onUserSelect?: (user: User) => void;
  placeholder?: string;
  className?: string;
}

export function SearchUser({ 
  onUserSelect, 
  placeholder = "Search users...",
  className = ""
}: SearchUserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Debounce the search term to avoid too many API calls
  useDebounce(searchTerm, (value: string) => {
    setDebouncedSearchTerm(value);
    setIsDropdownOpen(value.trim().length > 0);
  }, { delay: 300 });

  // Use the search hook with the debounced term
  const { data: searchResults, isLoading, error } = useUserSearch(
    debouncedSearchTerm,
    {
      enabled: debouncedSearchTerm.trim().length > 0
    }
  );

  const handleUserSelect = useCallback((user: User) => {
    onUserSelect?.(user);
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }, [onUserSelect]);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const renderUserItem = useCallback((user: User) => (
    <div className="flex flex-col">
      <span className="font-medium text-sm">
        {user.first_name} {user.last_name}
      </span>
    </div>
  ), []);

  const getUserKey = useCallback((user: User) => user.id, []);

  return (
    <SearchDropdown
      searchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
      isDropdownOpen={isDropdownOpen}
      onDropdownOpenChange={setIsDropdownOpen}
      placeholder={placeholder}
      className={className}
      isLoading={isLoading}
      error={error}
      items={searchResults?.users || []}
      onItemSelect={handleUserSelect}
      renderItem={renderUserItem}
      getItemKey={getUserKey}
      noResultsMessage={`No users found for "${debouncedSearchTerm}"`}
    />
  );
}
