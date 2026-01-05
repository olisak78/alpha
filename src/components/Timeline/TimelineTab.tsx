import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchQPATimeline } from '@/services/QPATimelineApi';
import { TimelineTable } from './TimelineTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TimelineTab() {
  // Fetch timeline data
  const { data, isLoading, error } = useQuery({
    queryKey: ['qpa-timeline'],
    queryFn: fetchQPATimeline,
    staleTime: 23 * 60 * 60 * 1000, // 23 hours (cache is 24 hours on backend)
    refetchInterval: 23 * 60 * 60 * 1000, // Refetch after 23 hours
  });

  // Extract available years and set current year as default
  const availableYears = useMemo(() => {
    if (!data?.data) return [];
    return Object.keys(data.data).sort().reverse(); // Most recent year first
  }, [data]);

  const currentYear = new Date().getFullYear().toString();
  const defaultYear = availableYears.includes(currentYear) ? currentYear : availableYears[0];

  const [selectedYear, setSelectedYear] = useState(defaultYear);

  // Update selected year when data loads
  useMemo(() => {
    if (defaultYear && !selectedYear) {
      setSelectedYear(defaultYear);
    }
  }, [defaultYear, selectedYear]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading timeline data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load timeline data. Please try again later.
          <br />
          <span className="text-xs mt-1 block">Error: {error instanceof Error ? error.message : 'Unknown error'}</span>
        </AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!data?.data || availableYears.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No timeline data available.
        </AlertDescription>
      </Alert>
    );
  }

  const yearData = data.data[selectedYear];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Landscape Update Timeline
              </CardTitle>
              <CardDescription className="mt-2">
                View scheduled landscape updates by Takt. Dates show when each landscape is planned for updates.
              </CardDescription>
            </div>
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm font-medium text-muted-foreground">
                Year:
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year-select" className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {yearData ? (
            <TimelineTable yearData={yearData} year={selectedYear} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No data available for {selectedYear}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Info */}
      {data.cached && data.cachedAt && (
        <div className="text-xs text-muted-foreground text-center">
          Data cached at {new Date(data.cachedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
