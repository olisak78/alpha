import { useState, useMemo, useCallback, useReducer } from 'react';
import { useTriggeredAlerts, useTriggeredAlertsFilters as useTriggeredAlertsFiltersApi } from '@/hooks/api/useTriggeredAlerts';
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
  // Filtered data
  filteredAlerts: TriggeredAlert[];
  // Loading states
  isLoading: boolean;
  filtersLoading: boolean;
  // Error state
  error: Error | null;
}

const LOCAL_STORAGE_FILTERS_KEY = 'triggeredAlertsFilters';

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
  };
};

// Configuration for filter types to reduce code duplication
type FilterType = 'severity' | 'status' | 'landscape' | 'region';

interface FilterConfig {
  selectedKey: keyof FilterState;
  excludedKey: keyof FilterState;
  alertProperty: keyof TriggeredAlert;
}

const FILTER_CONFIGS: Record<FilterType, FilterConfig> = {
  severity: {
    selectedKey: 'selectedSeverity',
    excludedKey: 'excludedSeverity',
    alertProperty: 'severity'
  },
  status: {
    selectedKey: 'selectedStatus',
    excludedKey: 'excludedStatus',
    alertProperty: 'status'
  },
  landscape: {
    selectedKey: 'selectedLandscape',
    excludedKey: 'excludedLandscape',
    alertProperty: 'landscape'
  },
  region: {
    selectedKey: 'selectedRegion',
    excludedKey: 'excludedRegion',
    alertProperty: 'region'
  }
};

// Reducer for managing filter state
type FilterAction = 
  | { type: 'SET_FILTER'; filterType: FilterType; values: string[]; projectId: string }
  | { type: 'RESET_FILTER'; filterType: FilterType; projectId: string }
  | { type: 'ADD_EXCLUDED'; filterType: FilterType; value: string; projectId: string }
  | { type: 'REMOVE_EXCLUDED'; filterType: FilterType; value: string; projectId: string }
  | { type: 'CLEAR_ALL_EXCLUDED'; filterType: FilterType; projectId: string }
  | { type: 'SET_SEARCH_TERM'; value: string; projectId: string }
  | { type: 'SET_DATE_RANGE'; startDate: string; endDate: string; projectId: string }
  | { type: 'SET_START_DATE'; value: string; projectId: string }
  | { type: 'SET_END_DATE'; value: string; projectId: string }
  | { type: 'RESET_ALL'; projectId: string }
  | { type: 'ADD_EXCLUDED_ALERTNAME'; value: string; projectId: string }
  | { type: 'REMOVE_EXCLUDED_ALERTNAME'; value: string; projectId: string }
  | { type: 'CLEAR_ALL_EXCLUDED_ALERTNAME'; projectId: string };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  const storageKey = getLocalStorageKey(action.projectId);
  switch (action.type) {
    case 'SET_FILTER': {
      const config = FILTER_CONFIGS[action.filterType];
      const newState = {
        ...state,
        [config.selectedKey]: action.values
      };
      
      // Clear exclusion filter for selected values to avoid conflicts
      if (action.values.length > 0) {
        const excludedArray = state[config.excludedKey] as string[];
        (newState as any)[config.excludedKey] = excludedArray.filter(item => !action.values.includes(item));
      }
      // Store the entire state for simplicity and consistency
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'RESET_FILTER': {
      const config = FILTER_CONFIGS[action.filterType];
      const newState = {
        ...state,
        [config.selectedKey]: []
      };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'ADD_EXCLUDED': {
      const config = FILTER_CONFIGS[action.filterType];
      const selectedValues = state[config.selectedKey] as string[];
      
      // If inclusion filter is currently applied with this value, remove it
      if (selectedValues.includes(action.value)) {
        const newState = {
          ...state,
          [config.selectedKey]: selectedValues.filter(item => item !== action.value)
        };
        localStorage.setItem(storageKey, JSON.stringify(newState));
        return newState;
      }
      
      // Otherwise, toggle exclusion filter
      const excludedArray = state[config.excludedKey] as string[];
      const newExcluded = excludedArray.includes(action.value)
        ? excludedArray.filter(item => item !== action.value)
        : [...excludedArray, action.value];
      
      const newState = {
        ...state,
        [config.excludedKey]: newExcluded
      };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'REMOVE_EXCLUDED': {
      const config = FILTER_CONFIGS[action.filterType];
      const excludedArray = state[config.excludedKey] as string[];
      const newState = {
        ...state,
        [config.excludedKey]: excludedArray.filter(item => item !== action.value)
      };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'CLEAR_ALL_EXCLUDED': {
      const config = FILTER_CONFIGS[action.filterType];
      const newState = {
        ...state,
        [config.excludedKey]: []
      };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'SET_SEARCH_TERM': {
      const newState = { ...state, searchTerm: action.value };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'SET_DATE_RANGE': {
      const newState = { ...state, startDate: action.startDate, endDate: action.endDate };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'SET_START_DATE': {
      const newState = { ...state, startDate: action.value };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'SET_END_DATE': {
      const newState = { ...state, endDate: action.value };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'ADD_EXCLUDED_ALERTNAME': {
      // If search term matches this value, just clear it
      if (state.searchTerm === action.value) {
        const newState = { ...state, searchTerm: '' };
        localStorage.setItem(storageKey, JSON.stringify(newState));
        return newState;
      }
      
      // Otherwise, toggle exclusion filter
      const newExcluded = state.excludedAlertname.includes(action.value)
        ? state.excludedAlertname.filter(item => item !== action.value)
        : [...state.excludedAlertname, action.value];
      
      const newState = { ...state, excludedAlertname: newExcluded };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'REMOVE_EXCLUDED_ALERTNAME': {
      const newState = {
        ...state,
        excludedAlertname: state.excludedAlertname.filter(item => item !== action.value)
      };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'CLEAR_ALL_EXCLUDED_ALERTNAME': {
      const newState = { ...state, excludedAlertname: [] };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    }
    
    case 'RESET_ALL': {
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
      };
      localStorage.setItem(storageKey, JSON.stringify(defaultState));
      return defaultState;
    }
    
    default:
      return state;
  }
}

export function useTriggeredAlertsFilters(projectId: string): UseTriggeredAlertsFiltersReturn {
  // Use reducer for consolidated state management with project-specific initial state
  const [filters, dispatch] = useReducer(filterReducer, getInitialFilterState(projectId));

  // Fetch triggered alerts using the API hook
  const { data: alertsResponse, isLoading, error } = useTriggeredAlerts(projectId);
  const triggeredAlerts = alertsResponse?.data || [];

  // Fetch filter options from API
  const { data: filtersResponse, isLoading: filtersLoading } = useTriggeredAlertsFiltersApi(projectId);


  // Generic helper functions using the reducer
  const createFilterSetter = useCallback((filterType: FilterType) => 
    (values: string[]) => dispatch({ type: 'SET_FILTER', filterType, values, projectId }), [projectId]);

  const createFilterRemover = useCallback((filterType: FilterType) => 
    () => dispatch({ type: 'RESET_FILTER', filterType, projectId }), [projectId]);

  const createExclusionAdder = useCallback((filterType: FilterType) => 
    (value: string) => dispatch({ type: 'ADD_EXCLUDED', filterType, value, projectId }), [projectId]);

  const createExclusionRemover = useCallback((filterType: FilterType) => 
    (value: string) => dispatch({ type: 'REMOVE_EXCLUDED', filterType, value, projectId }), [projectId]);

  const createExclusionClearer = useCallback((filterType: FilterType) => 
    () => dispatch({ type: 'CLEAR_ALL_EXCLUDED', filterType, projectId }), [projectId]);

  // Create all the action functions
  const resetFilters = useCallback(() => dispatch({ type: 'RESET_ALL', projectId }), [projectId]);
  
  // Search term actions
  const setSearchTerm = useCallback((value: string) => 
    dispatch({ type: 'SET_SEARCH_TERM', value, projectId }), [projectId]);
  const removeSearchTerm = useCallback(() => 
    dispatch({ type: 'SET_SEARCH_TERM', value: '', projectId }), [projectId]);

  // Date range actions
  const setStartDate = useCallback((value: string) => {
    dispatch({ type: 'SET_START_DATE', value, projectId });
  }, [projectId]);
  const setEndDate = useCallback((value: string) => {
    dispatch({ type: 'SET_END_DATE', value, projectId });
  }, [projectId]);
  const removeDateRange = useCallback(() => 
    dispatch({ type: 'SET_DATE_RANGE', startDate: '', endDate: '', projectId }), [projectId]);

  // Filter-specific actions using the generic helpers
  const setSelectedSeverity = createFilterSetter('severity');
  const setSelectedStatus = createFilterSetter('status');
  const setSelectedLandscape = createFilterSetter('landscape');
  const setSelectedRegion = createFilterSetter('region');

  const removeSeverity = createFilterRemover('severity');
  const removeStatus = createFilterRemover('status');
  const removeLandscape = createFilterRemover('landscape');
  const removeRegion = createFilterRemover('region');

  const addExcludedSeverity = createExclusionAdder('severity');
  const addExcludedStatus = createExclusionAdder('status');
  const addExcludedLandscape = createExclusionAdder('landscape');
  const addExcludedRegion = createExclusionAdder('region');

  const removeExcludedSeverity = createExclusionRemover('severity');
  const removeExcludedStatus = createExclusionRemover('status');
  const removeExcludedLandscape = createExclusionRemover('landscape');
  const removeExcludedRegion = createExclusionRemover('region');

  const clearAllExcludedSeverity = createExclusionClearer('severity');
  const clearAllExcludedStatus = createExclusionClearer('status');
  const clearAllExcludedLandscape = createExclusionClearer('landscape');
  const clearAllExcludedRegion = createExclusionClearer('region');

  // Alert name exclusion actions
  const addExcludedAlertname = useCallback((value: string) => 
    dispatch({ type: 'ADD_EXCLUDED_ALERTNAME', value, projectId }), [projectId]);
  const removeExcludedAlertname = useCallback((value: string) => 
    dispatch({ type: 'REMOVE_EXCLUDED_ALERTNAME', value, projectId }), [projectId]);
  const clearAllExcludedAlertname = useCallback(() => 
    dispatch({ type: 'CLEAR_ALL_EXCLUDED_ALERTNAME', projectId }), [projectId]);

  // Date range selection handler
  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    const startDate = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const endDate = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    dispatch({ type: 'SET_DATE_RANGE', startDate, endDate, projectId });
  }, [projectId]);

  // Generic helper for creating filter options
  const createFilterOptions = useCallback((
    filterData: string[] | undefined, 
    fallback: string[] = []
  ) => {
    return filterData && filterData.length > 0 ? filterData.sort() : fallback;
  }, []);

  // Get filter values from API response using the generic helper
  const severities = useMemo(() => 
    createFilterOptions(filtersResponse?.severity), [filtersResponse?.severity, createFilterOptions]);

  const statuses = useMemo(() => 
    createFilterOptions(filtersResponse?.status), [filtersResponse?.status, createFilterOptions]);

  const landscapes = useMemo(() => 
    createFilterOptions(filtersResponse?.landscape), [filtersResponse?.landscape, createFilterOptions]);

  const regions = useMemo(() => 
    createFilterOptions(filtersResponse?.region), [filtersResponse?.region, createFilterOptions]);


  // Generic filter matching function
  const createFilterMatcher = useCallback((filterType: FilterType) => {
    return (alert: TriggeredAlert): boolean => {
      const config = FILTER_CONFIGS[filterType];
      const selectedValues = filters[config.selectedKey] as string[];
      const excludedArray = filters[config.excludedKey] as string[];
      
      // Get the alert property value
      const alertValue = alert[config.alertProperty] as string;
      
      // Check exclusion filter first
      if (excludedArray.length > 0 && excludedArray.includes(alertValue)) return false;
      
      // Then check inclusion filter - if no values selected, show all
      return selectedValues.length === 0 || selectedValues.includes(alertValue);
    };
  }, [filters]);

  // Create individual filter functions using the generic matcher
  const matchesRegionFilter = useMemo(() => createFilterMatcher('region'), [createFilterMatcher]);
  const matchesSeverityFilter = useMemo(() => createFilterMatcher('severity'), [createFilterMatcher]);
  const matchesStatusFilter = useMemo(() => createFilterMatcher('status'), [createFilterMatcher]);
  const matchesLandscapeFilter = useMemo(() => createFilterMatcher('landscape'), [createFilterMatcher]);

  const matchesTimeRangeFilter = useCallback((alert: TriggeredAlert): boolean => {
    if (!filters.startDate && !filters.endDate) return true;
    
    const alertStart = new Date(alert.startsAt);
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (alertStart < startDate) {
        return false;
      }
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      // Set end date to end of day to include alerts on the end date
      endDate.setHours(23, 59, 59, 999);
      if (alertStart > endDate) {
        return false;
      }
    }
    
    return true;
  }, [filters.startDate, filters.endDate]);

  const matchesSearchFilter = useCallback((alert: TriggeredAlert): boolean => {
    // Check exclusion filter first
    if (filters.excludedAlertname.length > 0 && filters.excludedAlertname.includes(alert.alertname)) return false;
    
    if (!filters.searchTerm) return true;
    
    const searchLower = filters.searchTerm.toLowerCase();
    
    return (
      alert.alertname.toLowerCase().includes(searchLower) ||
      alert.landscape.toLowerCase().includes(searchLower) ||
      alert.severity.toLowerCase().includes(searchLower) ||
      alert.status.toLowerCase().includes(searchLower)
    );
  }, [filters.searchTerm, filters.excludedAlertname]);

  // Main filter function - combines all individual filters and sorts by status then time
  const filteredAlerts = useMemo(() => {
    return triggeredAlerts
      .filter(alert => {
        return (
          matchesRegionFilter(alert) &&
          matchesSeverityFilter(alert) &&
          matchesStatusFilter(alert) &&
          matchesLandscapeFilter(alert) &&
          matchesTimeRangeFilter(alert) &&
          matchesSearchFilter(alert)
        );
      })
      .sort((a, b) => {
        // First, sort by status: firing alerts come first
        const aIsFiring = a.status.toLowerCase() === 'firing';
        const bIsFiring = b.status.toLowerCase() === 'firing';
        
        if (aIsFiring && !bIsFiring) return -1;
        if (!aIsFiring && bIsFiring) return 1;
        
        // Within the same status group, sort by startsAt in descending order (newest first)
        const dateA = new Date(a.startsAt).getTime();
        const dateB = new Date(b.startsAt).getTime();
        return dateB - dateA;
      });
  }, [
    triggeredAlerts,
    matchesRegionFilter,
    matchesSeverityFilter,
    matchesStatusFilter,
    matchesLandscapeFilter,
    matchesTimeRangeFilter,
    matchesSearchFilter
  ]);

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
  };
}
