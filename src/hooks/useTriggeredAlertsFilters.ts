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
  selectedComponent: string[];
  startDate: string;
  endDate: string;
  excludedSeverity: string[];
  excludedStatus: string[];
  excludedLandscape: string[];
  excludedRegion: string[];
  excludedComponent: string[];
  excludedAlertname: string[];
}

export interface FilterActions {
  setSearchTerm: (value: string) => void;
  setSelectedSeverity: (values: string[]) => void;
  setSelectedStatus: (values: string[]) => void;
  setSelectedLandscape: (values: string[]) => void;
  setSelectedRegion: (values: string[]) => void;
  setSelectedComponent: (values: string[]) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  addExcludedSeverity: (value: string) => void;
  addExcludedStatus: (value: string) => void;
  addExcludedLandscape: (value: string) => void;
  addExcludedRegion: (value: string) => void;
  addExcludedComponent: (value: string) => void;
  addExcludedAlertname: (value: string) => void;
  handleDateRangeSelect: (range: DateRange | undefined) => void;
  resetFilters: () => void;
  // Individual filter removal functions
  removeSearchTerm: () => void;
  removeSeverity: () => void;
  removeStatus: () => void;
  removeLandscape: () => void;
  removeRegion: () => void;
  removeComponent: () => void;
  removeDateRange: () => void;
  removeExcludedSeverity: (value: string) => void;
  removeExcludedStatus: (value: string) => void;
  removeExcludedLandscape: (value: string) => void;
  removeExcludedRegion: (value: string) => void;
  removeExcludedComponent: (value: string) => void;
  removeExcludedAlertname: (value: string) => void;
  clearAllExcludedSeverity: () => void;
  clearAllExcludedStatus: () => void;
  clearAllExcludedLandscape: () => void;
  clearAllExcludedRegion: () => void;
  clearAllExcludedComponent: () => void;
  clearAllExcludedAlertname: () => void;
}

export interface FilterOptions {
  severities: string[];
  statuses: string[];
  landscapes: string[];
  regions: string[];
  components: string[];
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

const initialFilterState: FilterState = {
  searchTerm: '',
  selectedSeverity: [],
  selectedStatus: [],
  selectedLandscape: [],
  selectedRegion: [],
  selectedComponent: [],
  startDate: '',
  endDate: '',
  excludedSeverity: [],
  excludedStatus: [],
  excludedLandscape: [],
  excludedRegion: [],
  excludedComponent: [],
  excludedAlertname: [],
};

// Configuration for filter types to reduce code duplication
type FilterType = 'severity' | 'status' | 'landscape' | 'region' | 'component';

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
  },
  component: {
    selectedKey: 'selectedComponent',
    excludedKey: 'excludedComponent',
    alertProperty: 'component'
  }
};

// Reducer for managing filter state
type FilterAction = 
  | { type: 'SET_FILTER'; filterType: FilterType; values: string[] }
  | { type: 'RESET_FILTER'; filterType: FilterType }
  | { type: 'ADD_EXCLUDED'; filterType: FilterType; value: string }
  | { type: 'REMOVE_EXCLUDED'; filterType: FilterType; value: string }
  | { type: 'CLEAR_ALL_EXCLUDED'; filterType: FilterType }
  | { type: 'SET_SEARCH_TERM'; value: string }
  | { type: 'SET_DATE_RANGE'; startDate: string; endDate: string }
  | { type: 'SET_START_DATE'; value: string }
  | { type: 'SET_END_DATE'; value: string }
  | { type: 'RESET_ALL' }
  | { type: 'ADD_EXCLUDED_ALERTNAME'; value: string }
  | { type: 'REMOVE_EXCLUDED_ALERTNAME'; value: string }
  | { type: 'CLEAR_ALL_EXCLUDED_ALERTNAME' };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
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
      
      return newState;
    }
    
    case 'RESET_FILTER': {
      const config = FILTER_CONFIGS[action.filterType];
      return {
        ...state,
        [config.selectedKey]: initialFilterState[config.selectedKey]
      };
    }
    
    case 'ADD_EXCLUDED': {
      const config = FILTER_CONFIGS[action.filterType];
      const selectedValues = state[config.selectedKey] as string[];
      
      // If inclusion filter is currently applied with this value, remove it
      if (selectedValues.includes(action.value)) {
        return {
          ...state,
          [config.selectedKey]: selectedValues.filter(item => item !== action.value)
        };
      }
      
      // Otherwise, toggle exclusion filter
      const excludedArray = state[config.excludedKey] as string[];
      const newExcluded = excludedArray.includes(action.value)
        ? excludedArray.filter(item => item !== action.value)
        : [...excludedArray, action.value];
      
      return {
        ...state,
        [config.excludedKey]: newExcluded
      };
    }
    
    case 'REMOVE_EXCLUDED': {
      const config = FILTER_CONFIGS[action.filterType];
      const excludedArray = state[config.excludedKey] as string[];
      return {
        ...state,
        [config.excludedKey]: excludedArray.filter(item => item !== action.value)
      };
    }
    
    case 'CLEAR_ALL_EXCLUDED': {
      const config = FILTER_CONFIGS[action.filterType];
      return {
        ...state,
        [config.excludedKey]: initialFilterState[config.excludedKey]
      };
    }
    
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.value };
    
    case 'SET_DATE_RANGE':
      return { ...state, startDate: action.startDate, endDate: action.endDate };
    
    case 'SET_START_DATE':
      return { ...state, startDate: action.value };
    
    case 'SET_END_DATE':
      return { ...state, endDate: action.value };
    
    case 'ADD_EXCLUDED_ALERTNAME': {
      // If search term matches this value, just clear it
      if (state.searchTerm === action.value) {
        return { ...state, searchTerm: '' };
      }
      
      // Otherwise, toggle exclusion filter
      const newExcluded = state.excludedAlertname.includes(action.value)
        ? state.excludedAlertname.filter(item => item !== action.value)
        : [...state.excludedAlertname, action.value];
      
      return { ...state, excludedAlertname: newExcluded };
    }
    
    case 'REMOVE_EXCLUDED_ALERTNAME':
      return {
        ...state,
        excludedAlertname: state.excludedAlertname.filter(item => item !== action.value)
      };
    
    case 'CLEAR_ALL_EXCLUDED_ALERTNAME':
      return { ...state, excludedAlertname: [] };
    
    case 'RESET_ALL':
      return initialFilterState;
    
    default:
      return state;
  }
}

export function useTriggeredAlertsFilters(projectId: string): UseTriggeredAlertsFiltersReturn {
  // Use reducer for consolidated state management
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);

  // Fetch triggered alerts using the API hook
  const { data: alertsResponse, isLoading, error } = useTriggeredAlerts(projectId);
  const triggeredAlerts = alertsResponse?.data || [];

  // Fetch filter options from API
  const { data: filtersResponse, isLoading: filtersLoading } = useTriggeredAlertsFiltersApi(projectId);

  // Helper function to extract component name from alert
  const getAlertComponent = useCallback((alert: TriggeredAlert): string => {
    return alert.component || 'N/A';
  }, []);

  // Generic helper functions using the reducer
  const createFilterSetter = useCallback((filterType: FilterType) => 
    (values: string[]) => dispatch({ type: 'SET_FILTER', filterType, values }), []);

  const createFilterRemover = useCallback((filterType: FilterType) => 
    () => dispatch({ type: 'RESET_FILTER', filterType }), []);

  const createExclusionAdder = useCallback((filterType: FilterType) => 
    (value: string) => dispatch({ type: 'ADD_EXCLUDED', filterType, value }), []);

  const createExclusionRemover = useCallback((filterType: FilterType) => 
    (value: string) => dispatch({ type: 'REMOVE_EXCLUDED', filterType, value }), []);

  const createExclusionClearer = useCallback((filterType: FilterType) => 
    () => dispatch({ type: 'CLEAR_ALL_EXCLUDED', filterType }), []);

  // Create all the action functions
  const resetFilters = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);
  
  // Search term actions
  const setSearchTerm = useCallback((value: string) => 
    dispatch({ type: 'SET_SEARCH_TERM', value }), []);
  const removeSearchTerm = useCallback(() => 
    dispatch({ type: 'SET_SEARCH_TERM', value: '' }), []);

  // Date range actions
  const setStartDate = useCallback((value: string) => {
    dispatch({ type: 'SET_START_DATE', value });
  }, []);
  const setEndDate = useCallback((value: string) => {
    dispatch({ type: 'SET_END_DATE', value });
  }, []);
  const removeDateRange = useCallback(() => 
    dispatch({ type: 'SET_DATE_RANGE', startDate: '', endDate: '' }), []);

  // Filter-specific actions using the generic helpers
  const setSelectedSeverity = createFilterSetter('severity');
  const setSelectedStatus = createFilterSetter('status');
  const setSelectedLandscape = createFilterSetter('landscape');
  const setSelectedRegion = createFilterSetter('region');
  const setSelectedComponent = createFilterSetter('component');

  const removeSeverity = createFilterRemover('severity');
  const removeStatus = createFilterRemover('status');
  const removeLandscape = createFilterRemover('landscape');
  const removeRegion = createFilterRemover('region');
  const removeComponent = createFilterRemover('component');

  const addExcludedSeverity = createExclusionAdder('severity');
  const addExcludedStatus = createExclusionAdder('status');
  const addExcludedLandscape = createExclusionAdder('landscape');
  const addExcludedRegion = createExclusionAdder('region');
  const addExcludedComponent = createExclusionAdder('component');

  const removeExcludedSeverity = createExclusionRemover('severity');
  const removeExcludedStatus = createExclusionRemover('status');
  const removeExcludedLandscape = createExclusionRemover('landscape');
  const removeExcludedRegion = createExclusionRemover('region');
  const removeExcludedComponent = createExclusionRemover('component');

  const clearAllExcludedSeverity = createExclusionClearer('severity');
  const clearAllExcludedStatus = createExclusionClearer('status');
  const clearAllExcludedLandscape = createExclusionClearer('landscape');
  const clearAllExcludedRegion = createExclusionClearer('region');
  const clearAllExcludedComponent = createExclusionClearer('component');

  // Alert name exclusion actions
  const addExcludedAlertname = useCallback((value: string) => 
    dispatch({ type: 'ADD_EXCLUDED_ALERTNAME', value }), []);
  const removeExcludedAlertname = useCallback((value: string) => 
    dispatch({ type: 'REMOVE_EXCLUDED_ALERTNAME', value }), []);
  const clearAllExcludedAlertname = useCallback(() => 
    dispatch({ type: 'CLEAR_ALL_EXCLUDED_ALERTNAME' }), []);

  // Date range selection handler
  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    const startDate = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const endDate = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    dispatch({ type: 'SET_DATE_RANGE', startDate, endDate });
  }, []);

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

  const components = useMemo(() => 
    createFilterOptions(filtersResponse?.component), [filtersResponse?.component, createFilterOptions]);

  // Generic filter matching function
  const createFilterMatcher = useCallback((filterType: FilterType) => {
    return (alert: TriggeredAlert): boolean => {
      const config = FILTER_CONFIGS[filterType];
      const selectedValues = filters[config.selectedKey] as string[];
      const excludedArray = filters[config.excludedKey] as string[];
      
      // Get the alert property value, handling component special case
      let alertValue: string;
      if (filterType === 'component') {
        alertValue = getAlertComponent(alert);
      } else {
        alertValue = alert[config.alertProperty] as string;
      }
      
      // Check exclusion filter first
      if (excludedArray.length > 0 && excludedArray.includes(alertValue)) return false;
      
      // Then check inclusion filter - if no values selected, show all
      return selectedValues.length === 0 || selectedValues.includes(alertValue);
    };
  }, [filters, getAlertComponent]);

  // Create individual filter functions using the generic matcher
  const matchesRegionFilter = useMemo(() => createFilterMatcher('region'), [createFilterMatcher]);
  const matchesSeverityFilter = useMemo(() => createFilterMatcher('severity'), [createFilterMatcher]);
  const matchesStatusFilter = useMemo(() => createFilterMatcher('status'), [createFilterMatcher]);
  const matchesLandscapeFilter = useMemo(() => createFilterMatcher('landscape'), [createFilterMatcher]);
  const matchesComponentFilter = useMemo(() => createFilterMatcher('component'), [createFilterMatcher]);

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
    const component = getAlertComponent(alert);
    
    return (
      alert.alertname.toLowerCase().includes(searchLower) ||
      component.toLowerCase().includes(searchLower) ||
      alert.landscape.toLowerCase().includes(searchLower) ||
      alert.severity.toLowerCase().includes(searchLower) ||
      alert.status.toLowerCase().includes(searchLower)
    );
  }, [filters.searchTerm, filters.excludedAlertname, getAlertComponent]);

  // Main filter function - combines all individual filters and sorts by time (newest first)
  const filteredAlerts = useMemo(() => {
    return triggeredAlerts
      .filter(alert => {
        return (
          matchesRegionFilter(alert) &&
          matchesSeverityFilter(alert) &&
          matchesStatusFilter(alert) &&
          matchesLandscapeFilter(alert) &&
          matchesComponentFilter(alert) &&
          matchesTimeRangeFilter(alert) &&
          matchesSearchFilter(alert)
        );
      })
      .sort((a, b) => {
        // Sort by startsAt in descending order (newest first)
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
    matchesComponentFilter,
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
      setSelectedComponent,
      setStartDate,
      setEndDate,
      addExcludedSeverity,
      addExcludedStatus,
      addExcludedLandscape,
      addExcludedRegion,
      addExcludedComponent,
      addExcludedAlertname,
      handleDateRangeSelect,
      resetFilters,
      removeSearchTerm,
      removeSeverity,
      removeStatus,
      removeLandscape,
      removeRegion,
      removeComponent,
      removeDateRange,
      removeExcludedSeverity,
      removeExcludedStatus,
      removeExcludedLandscape,
      removeExcludedRegion,
      removeExcludedComponent,
      removeExcludedAlertname,
      clearAllExcludedSeverity,
      clearAllExcludedStatus,
      clearAllExcludedLandscape,
      clearAllExcludedRegion,
      clearAllExcludedComponent,
      clearAllExcludedAlertname,
    },
    options: {
      severities,
      statuses,
      landscapes,
      regions,
      components,
    },
    filteredAlerts,
    isLoading,
    filtersLoading,
    error,
  };
}
