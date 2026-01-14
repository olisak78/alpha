import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTriggeredAlerts, useTriggeredAlertsFilters as useTriggeredAlertsFiltersApi } from '@/hooks/api/useTriggeredAlerts';
import { TriggeredAlertsQueryParams } from '@/services/triggeredAlertsApi';
import type { TriggeredAlert } from '@/types/api';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface FilterState {
  searchTerm: string;
  selectedSeverity: string[];
  selectedLandscape: string[];
  selectedRegion: string[];
  startDate: string;
  endDate: string;
  excludedSeverity: string[];
  excludedLandscape: string[];
  excludedRegion: string[];
  excludedAlertname: string[];
  page: number;
  pageSize: number;
}

export interface FilterActions {
  setSearchTerm: (value: string) => void;
  setSelectedSeverity: (values: string[]) => void;
  setSelectedLandscape: (values: string[]) => void;
  setSelectedRegion: (values: string[]) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  addExcludedSeverity: (value: string) => void;
  addExcludedLandscape: (value: string) => void;
  addExcludedRegion: (value: string) => void;
  addExcludedAlertname: (value: string) => void;
  handleDateRangeSelect: (range: DateRange | undefined) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  // Individual filter removal functions
  removeSearchTerm: () => void;
  removeSeverity: () => void;
  removeLandscape: () => void;
  removeRegion: () => void;
  removeDateRange: () => void;
  removeExcludedSeverity: (value: string) => void;
  removeExcludedLandscape: (value: string) => void;
  removeExcludedRegion: (value: string) => void;
  removeExcludedAlertname: (value: string) => void;
  clearAllExcludedSeverity: () => void;
  clearAllExcludedLandscape: () => void;
  clearAllExcludedRegion: () => void;
  clearAllExcludedAlertname: () => void;
}

export interface FilterOptions {
  severities: string[];
  landscapes: string[];
  regions: string[];
}

export interface UseTriggeredAlertsFiltersReturn {
  // Filter state
  filters: FilterState;
  // Filter actions
  actions: FilterActions;
  // Filter options
  options: FilterOptions;
  // Filtered data (now comes from backend)
  filteredAlerts: TriggeredAlert[];
  // Loading states
  isLoading: boolean;
  filtersLoading: boolean;
  // Error state
  error: Error | null;
  // Pagination info
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_PAGE_SIZE = 50; // Default page size as requested

const getLocalStorageKey = (projectId: string, initialStatusFilter?: string[]): string => {
  // Determine the key suffix based on the status filter
  if (initialStatusFilter && initialStatusFilter.length > 0) {
    if (initialStatusFilter.includes('firing')) {
      return `activeAlertsFilters_${projectId}`;
    } else if (initialStatusFilter.includes('resolved')) {
      return `historyAlertsFilters_${projectId}`;
    }
  }
  // Fallback to the old key for backward compatibility
  return `triggeredAlertsFilters_${projectId}`;
};

const getInitialFilterState = (projectId: string, initialStatusFilter?: string[]): FilterState => {
  try {
    const storageKey = getLocalStorageKey(projectId, initialStatusFilter);
    const savedFilters = localStorage.getItem(storageKey);
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // Validate that the parsed object has all required properties
      const defaultState: FilterState = {
        searchTerm: '',
        selectedSeverity: [],
        selectedLandscape: [],
        selectedRegion: [],
        startDate: '',
        endDate: '',
        excludedSeverity: [],
        excludedLandscape: [],
        excludedRegion: [],
        excludedAlertname: [],
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      };
      
      // Merge saved filters with default state to ensure all properties exist
      const mergedFilters = { ...defaultState, ...parsedFilters };
      return mergedFilters;
    }
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
  }
  
  // Return default state if localStorage is empty or invalid
  return {
    searchTerm: '',
    selectedSeverity: [],
    selectedLandscape: [],
    selectedRegion: [],
    startDate: '',
    endDate: '',
    excludedSeverity: [],
    excludedLandscape: [],
    excludedRegion: [],
    excludedAlertname: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
};

const saveFiltersToStorage = (projectId: string, filters: FilterState, initialStatusFilter?: string[]) => {
  try {
    const storageKey = getLocalStorageKey(projectId, initialStatusFilter);
    // Exclude page and pageSize from being saved to localStorage
    const { page, pageSize, ...filtersToSave } = filters;
    localStorage.setItem(storageKey, JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

export function useTriggeredAlertsFilters(projectId: string, initialStatusFilter?: string[]): UseTriggeredAlertsFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(() => getInitialFilterState(projectId, initialStatusFilter));

  // Convert filters to API query parameters
  const queryParams = useMemo((): TriggeredAlertsQueryParams => {
    const params: TriggeredAlertsQueryParams = {
      page: filters.page,
      pageSize: filters.pageSize,
    };

    // Handle status filter from initialStatusFilter
    if (initialStatusFilter && initialStatusFilter.length > 0) {
      params.status = initialStatusFilter.join(',');
    }

    // Handle severity - combine selected and excluded
    if (filters.selectedSeverity.length > 0) {
      params.severity = filters.selectedSeverity.join(',');
    }


    // Handle landscape - combine selected and excluded
    if (filters.selectedLandscape.length > 0) {
      params.landscape = filters.selectedLandscape.join(',');
    }

    // Handle region - combine selected and excluded
    if (filters.selectedRegion.length > 0) {
      params.region = filters.selectedRegion.join(',');
    }

    // Handle alert name search
    if (filters.searchTerm) {
      params.alertname = filters.searchTerm;
    }

    // Handle date range
    if (filters.startDate) {
      params.start_time = filters.startDate;
    }
    if (filters.endDate) {
      params.end_time = filters.endDate;
    }

    return params;
  }, [filters, initialStatusFilter]);

  // Fetch triggered alerts using the API hook with query parameters
  const { data: alertsResponse, isLoading, error } = useTriggeredAlerts(projectId, queryParams);
  const triggeredAlerts = alertsResponse?.data || [];

  // Fetch filter options from API
  const { data: filtersResponse, isLoading: filtersLoading } = useTriggeredAlertsFiltersApi(projectId);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(projectId, filters, initialStatusFilter);
  }, [projectId, filters, initialStatusFilter]);

  // Update filter state helper
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset page to 1 when filters change (except page and pageSize changes)
  const updateFiltersWithPageReset = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates, page: 1 }));
  }, []);

  // Filter actions
  const setSearchTerm = useCallback((value: string) => {
    updateFiltersWithPageReset({ searchTerm: value });
  }, [updateFiltersWithPageReset]);

  const setSelectedSeverity = useCallback((values: string[]) => {
    updateFiltersWithPageReset({ 
      selectedSeverity: values,
      // Clear exclusions that conflict with selections
      excludedSeverity: filters.excludedSeverity.filter(item => !values.includes(item))
    });
  }, [updateFiltersWithPageReset, filters.excludedSeverity]);


  const setSelectedLandscape = useCallback((values: string[]) => {
    updateFiltersWithPageReset({ 
      selectedLandscape: values,
      excludedLandscape: filters.excludedLandscape.filter(item => !values.includes(item))
    });
  }, [updateFiltersWithPageReset, filters.excludedLandscape]);

  const setSelectedRegion = useCallback((values: string[]) => {
    updateFiltersWithPageReset({ 
      selectedRegion: values,
      excludedRegion: filters.excludedRegion.filter(item => !values.includes(item))
    });
  }, [updateFiltersWithPageReset, filters.excludedRegion]);

  const setStartDate = useCallback((value: string) => {
    
    updateFiltersWithPageReset({ startDate: value });
  }, [updateFiltersWithPageReset]);

  const setEndDate = useCallback((value: string) => {
    updateFiltersWithPageReset({ endDate: value });
  }, [updateFiltersWithPageReset]);

  const setPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const setPageSize = useCallback((pageSize: number) => {
    updateFiltersWithPageReset({ pageSize });
  }, [updateFiltersWithPageReset]);

  // Exclusion handlers (for UI compatibility, but won't affect backend filtering)
  const addExcludedSeverity = useCallback((value: string) => {
    if (filters.selectedSeverity.includes(value)) {
      setSelectedSeverity(filters.selectedSeverity.filter(item => item !== value));
    } else {
      const newExcluded = filters.excludedSeverity.includes(value)
        ? filters.excludedSeverity.filter(item => item !== value)
        : [...filters.excludedSeverity, value];
      updateFiltersWithPageReset({ excludedSeverity: newExcluded });
    }
  }, [filters.selectedSeverity, filters.excludedSeverity, setSelectedSeverity, updateFiltersWithPageReset]);


  const addExcludedLandscape = useCallback((value: string) => {
    if (filters.selectedLandscape.includes(value)) {
      setSelectedLandscape(filters.selectedLandscape.filter(item => item !== value));
    } else {
      const newExcluded = filters.excludedLandscape.includes(value)
        ? filters.excludedLandscape.filter(item => item !== value)
        : [...filters.excludedLandscape, value];
      updateFiltersWithPageReset({ excludedLandscape: newExcluded });
    }
  }, [filters.selectedLandscape, filters.excludedLandscape, setSelectedLandscape, updateFiltersWithPageReset]);

  const addExcludedRegion = useCallback((value: string) => {
    if (filters.selectedRegion.includes(value)) {
      setSelectedRegion(filters.selectedRegion.filter(item => item !== value));
    } else {
      const newExcluded = filters.excludedRegion.includes(value)
        ? filters.excludedRegion.filter(item => item !== value)
        : [...filters.excludedRegion, value];
      updateFiltersWithPageReset({ excludedRegion: newExcluded });
    }
  }, [filters.selectedRegion, filters.excludedRegion, setSelectedRegion, updateFiltersWithPageReset]);

  const addExcludedAlertname = useCallback((value: string) => {
    if (filters.searchTerm === value) {
      setSearchTerm('');
    } else {
      const newExcluded = filters.excludedAlertname.includes(value)
        ? filters.excludedAlertname.filter(item => item !== value)
        : [...filters.excludedAlertname, value];
      updateFiltersWithPageReset({ excludedAlertname: newExcluded });
    }
  }, [filters.searchTerm, filters.excludedAlertname, setSearchTerm, updateFiltersWithPageReset]);

  // Date range selection handler
  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    const startDate = range?.from ? range.from.toISOString() : "";
    const endDate = range?.to ? range.to.toISOString() : "";
    updateFiltersWithPageReset({ startDate, endDate });
  }, [updateFiltersWithPageReset]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultState: FilterState = {
      searchTerm: '',
      selectedSeverity: [],
      selectedLandscape: [],
      selectedRegion: [],
      startDate: '',
      endDate: '',
      excludedSeverity: [],
      excludedLandscape: [],
      excludedRegion: [],
      excludedAlertname: [],
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    setFilters(defaultState);
  }, []);

  // Individual filter removal functions
  const removeSearchTerm = useCallback(() => setSearchTerm(''), [setSearchTerm]);
  const removeSeverity = useCallback(() => setSelectedSeverity([]), [setSelectedSeverity]);
  const removeLandscape = useCallback(() => setSelectedLandscape([]), [setSelectedLandscape]);
  const removeRegion = useCallback(() => setSelectedRegion([]), [setSelectedRegion]);
  const removeDateRange = useCallback(() => {
    updateFiltersWithPageReset({ startDate: '', endDate: '' });
  }, [updateFiltersWithPageReset]);

  const removeExcludedSeverity = useCallback((value: string) => {
    updateFiltersWithPageReset({ 
      excludedSeverity: filters.excludedSeverity.filter(item => item !== value) 
    });
  }, [filters.excludedSeverity, updateFiltersWithPageReset]);


  const removeExcludedLandscape = useCallback((value: string) => {
    updateFiltersWithPageReset({ 
      excludedLandscape: filters.excludedLandscape.filter(item => item !== value) 
    });
  }, [filters.excludedLandscape, updateFiltersWithPageReset]);

  const removeExcludedRegion = useCallback((value: string) => {
    updateFiltersWithPageReset({ 
      excludedRegion: filters.excludedRegion.filter(item => item !== value) 
    });
  }, [filters.excludedRegion, updateFiltersWithPageReset]);

  const removeExcludedAlertname = useCallback((value: string) => {
    updateFiltersWithPageReset({ 
      excludedAlertname: filters.excludedAlertname.filter(item => item !== value) 
    });
  }, [filters.excludedAlertname, updateFiltersWithPageReset]);

  const clearAllExcludedSeverity = useCallback(() => {
    updateFiltersWithPageReset({ excludedSeverity: [] });
  }, [updateFiltersWithPageReset]);


  const clearAllExcludedLandscape = useCallback(() => {
    updateFiltersWithPageReset({ excludedLandscape: [] });
  }, [updateFiltersWithPageReset]);

  const clearAllExcludedRegion = useCallback(() => {
    updateFiltersWithPageReset({ excludedRegion: [] });
  }, [updateFiltersWithPageReset]);

  const clearAllExcludedAlertname = useCallback(() => {
    updateFiltersWithPageReset({ excludedAlertname: [] });
  }, [updateFiltersWithPageReset]);

  // Get filter options from API response
  const severities = useMemo(() => 
    filtersResponse?.severity?.sort() || [], [filtersResponse?.severity]);


  const landscapes = useMemo(() => 
    filtersResponse?.landscape?.sort() || [], [filtersResponse?.landscape]);

  const regions = useMemo(() => 
    filtersResponse?.region?.sort() || [], [filtersResponse?.region]);

  // Apply client-side exclusion filtering to backend results
  // This is needed because the backend doesn't support exclusion filters
  const filteredAlerts = useMemo(() => {
    return triggeredAlerts.filter(alert => {
      // Apply exclusion filters
      if (filters.excludedSeverity.length > 0 && filters.excludedSeverity.includes(alert.severity)) return false;
      if (filters.excludedLandscape.length > 0 && filters.excludedLandscape.includes(alert.landscape)) return false;
      if (filters.excludedRegion.length > 0 && filters.excludedRegion.includes(alert.region)) return false;
      if (filters.excludedAlertname.length > 0 && filters.excludedAlertname.includes(alert.alertname)) return false;
      
      return true;
    }).sort((a, b) => {
      // Sort by status: firing alerts come first
      const aIsFiring = a.status.toLowerCase() === 'firing';
      const bIsFiring = b.status.toLowerCase() === 'firing';
      
      if (aIsFiring && !bIsFiring) return -1;
      if (!aIsFiring && bIsFiring) return 1;
      
      // Within the same status group, sort by startsAt in descending order (newest first)
      const dateA = new Date(a.startsAt).getTime();
      const dateB = new Date(b.startsAt).getTime();
      return dateB - dateA;
    });
  }, [triggeredAlerts, filters.excludedSeverity, filters.excludedLandscape, filters.excludedRegion, filters.excludedAlertname]);

  // Use pagination info directly from API response
  const hasNextPage = alertsResponse ? alertsResponse.page < alertsResponse.totalPages : false;
  const hasPreviousPage = alertsResponse ? alertsResponse.page > 1 : false;
  const totalCount = alertsResponse ? alertsResponse.totalCount : 0;
  const totalPages = alertsResponse ? alertsResponse.totalPages : 1;

  return {
    filters,
    actions: {
      setSearchTerm,
      setSelectedSeverity,
      setSelectedLandscape,
      setSelectedRegion,
      setStartDate,
      setEndDate,
      addExcludedSeverity,
      addExcludedLandscape,
      addExcludedRegion,
      addExcludedAlertname,
      handleDateRangeSelect,
      resetFilters,
      setPage,
      setPageSize,
      removeSearchTerm,
      removeSeverity,
      removeLandscape,
      removeRegion,
      removeDateRange,
      removeExcludedSeverity,
      removeExcludedLandscape,
      removeExcludedRegion,
      removeExcludedAlertname,
      clearAllExcludedSeverity,
      clearAllExcludedLandscape,
      clearAllExcludedRegion,
      clearAllExcludedAlertname,
    },
    options: {
      severities,
      landscapes,
      regions,
    },
    filteredAlerts,
    isLoading,
    filtersLoading,
    error,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}
