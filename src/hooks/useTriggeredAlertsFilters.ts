import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTriggeredAlerts, useTriggeredAlertsFilters as useTriggeredAlertsFiltersApi } from '@/hooks/api/useTriggeredAlerts';
import { TriggeredAlertsQueryParams } from '@/services/triggeredAlertsApi';
import type { TriggeredAlert } from '@/types/api';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface FilterState {
  searchTerm: string;
  selectedSeverity: string[];
  selectedStatus: string[];
  selectedLandscape: string[];
  selectedRegion: string[];
  startDate: string;
  endDate: string;
  excludedSeverity: string[];
  excludedStatus: string[];
  excludedLandscape: string[];
  excludedRegion: string[];
  excludedAlertname: string[];
  page: number;
  pageSize: number;
}

export interface FilterActions {
  setSearchTerm: (value: string) => void;
  setSelectedSeverity: (values: string[]) => void;
  setSelectedStatus: (values: string[]) => void;
  setSelectedLandscape: (values: string[]) => void;
  setSelectedRegion: (values: string[]) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  addExcludedSeverity: (value: string) => void;
  addExcludedStatus: (value: string) => void;
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
  removeStatus: () => void;
  removeLandscape: () => void;
  removeRegion: () => void;
  removeDateRange: () => void;
  removeExcludedSeverity: (value: string) => void;
  removeExcludedStatus: (value: string) => void;
  removeExcludedLandscape: (value: string) => void;
  removeExcludedRegion: (value: string) => void;
  removeExcludedAlertname: (value: string) => void;
  clearAllExcludedSeverity: () => void;
  clearAllExcludedStatus: () => void;
  clearAllExcludedLandscape: () => void;
  clearAllExcludedRegion: () => void;
  clearAllExcludedAlertname: () => void;
}

export interface FilterOptions {
  severities: string[];
  statuses: string[];
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

const LOCAL_STORAGE_FILTERS_KEY = 'triggeredAlertsFilters';
const DEFAULT_PAGE_SIZE = 50; // Default page size as requested

const getLocalStorageKey = (projectId: string): string => {
  return `${LOCAL_STORAGE_FILTERS_KEY}_${projectId}`;
};

const getInitialFilterState = (projectId: string): FilterState => {
  try {
    const storageKey = getLocalStorageKey(projectId);
    const savedFilters = localStorage.getItem(storageKey);
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // Validate that the parsed object has all required properties
      const defaultState: FilterState = {
        searchTerm: '',
        selectedSeverity: [],
        selectedStatus: [],
        selectedLandscape: [],
        selectedRegion: [],
        startDate: '',
        endDate: '',
        excludedSeverity: [],
        excludedStatus: [],
        excludedLandscape: [],
        excludedRegion: [],
        excludedAlertname: [],
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      };
      
      // Merge saved filters with default state to ensure all properties exist
      return { ...defaultState, ...parsedFilters };
    }
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
  }
  
  // Return default state if localStorage is empty or invalid
  return {
    searchTerm: '',
    selectedSeverity: [],
    selectedStatus: [],
    selectedLandscape: [],
    selectedRegion: [],
    startDate: '',
    endDate: '',
    excludedSeverity: [],
    excludedStatus: [],
    excludedLandscape: [],
    excludedRegion: [],
    excludedAlertname: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
};

const saveFiltersToStorage = (projectId: string, filters: FilterState) => {
  try {
    const storageKey = getLocalStorageKey(projectId);
    // Exclude page and pageSize from being saved to localStorage
    const { page, pageSize, ...filtersToSave } = filters;
    localStorage.setItem(storageKey, JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

export function useTriggeredAlertsFilters(projectId: string): UseTriggeredAlertsFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(() => getInitialFilterState(projectId));

  // Convert filters to API query parameters
  const queryParams = useMemo((): TriggeredAlertsQueryParams => {
    const params: TriggeredAlertsQueryParams = {
      page: filters.page,
      pageSize: filters.pageSize,
    };

    // Handle severity - combine selected and excluded
    if (filters.selectedSeverity.length > 0) {
      params.severity = filters.selectedSeverity.join(',');
    }

    // Handle status - combine selected and excluded
    if (filters.selectedStatus.length > 0) {
      params.status = filters.selectedStatus.join(',');
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
  }, [filters]);

  // Fetch triggered alerts using the API hook with query parameters
  const { data: alertsResponse, isLoading, error } = useTriggeredAlerts(projectId, queryParams);
  const triggeredAlerts = alertsResponse?.data || [];

  // Fetch filter options from API
  const { data: filtersResponse, isLoading: filtersLoading } = useTriggeredAlertsFiltersApi(projectId);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(projectId, filters);
  }, [projectId, filters]);

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

  const setSelectedStatus = useCallback((values: string[]) => {
    updateFiltersWithPageReset({ 
      selectedStatus: values,
      excludedStatus: filters.excludedStatus.filter(item => !values.includes(item))
    });
  }, [updateFiltersWithPageReset, filters.excludedStatus]);

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

  const addExcludedStatus = useCallback((value: string) => {
    if (filters.selectedStatus.includes(value)) {
      setSelectedStatus(filters.selectedStatus.filter(item => item !== value));
    } else {
      const newExcluded = filters.excludedStatus.includes(value)
        ? filters.excludedStatus.filter(item => item !== value)
        : [...filters.excludedStatus, value];
      updateFiltersWithPageReset({ excludedStatus: newExcluded });
    }
  }, [filters.selectedStatus, filters.excludedStatus, setSelectedStatus, updateFiltersWithPageReset]);

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
      selectedStatus: [],
      selectedLandscape: [],
      selectedRegion: [],
      startDate: '',
      endDate: '',
      excludedSeverity: [],
      excludedStatus: [],
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
  const removeStatus = useCallback(() => setSelectedStatus([]), [setSelectedStatus]);
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

  const removeExcludedStatus = useCallback((value: string) => {
    updateFiltersWithPageReset({ 
      excludedStatus: filters.excludedStatus.filter(item => item !== value) 
    });
  }, [filters.excludedStatus, updateFiltersWithPageReset]);

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

  const clearAllExcludedStatus = useCallback(() => {
    updateFiltersWithPageReset({ excludedStatus: [] });
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

  const statuses = useMemo(() => 
    filtersResponse?.status?.sort() || [], [filtersResponse?.status]);

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
      if (filters.excludedStatus.length > 0 && filters.excludedStatus.includes(alert.status)) return false;
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
  }, [triggeredAlerts, filters.excludedSeverity, filters.excludedStatus, filters.excludedLandscape, filters.excludedRegion, filters.excludedAlertname]);

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
      setSelectedStatus,
      setSelectedLandscape,
      setSelectedRegion,
      setStartDate,
      setEndDate,
      addExcludedSeverity,
      addExcludedStatus,
      addExcludedLandscape,
      addExcludedRegion,
      addExcludedAlertname,
      handleDateRangeSelect,
      resetFilters,
      setPage,
      setPageSize,
      removeSearchTerm,
      removeSeverity,
      removeStatus,
      removeLandscape,
      removeRegion,
      removeDateRange,
      removeExcludedSeverity,
      removeExcludedStatus,
      removeExcludedLandscape,
      removeExcludedRegion,
      removeExcludedAlertname,
      clearAllExcludedSeverity,
      clearAllExcludedStatus,
      clearAllExcludedLandscape,
      clearAllExcludedRegion,
      clearAllExcludedAlertname,
    },
    options: {
      severities,
      statuses,
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
