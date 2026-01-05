import React from 'react';

interface HeatmapProps {
  title: string;
  data: Array<{ week: number; day: number; intensity: number; tooltip?: string }>;
  colors: string[];
  totalCount: number;
  countLabel: string;
  maxVisibleWeeks?: number;
}

export default function Heatmap({ 
  title, 
  data, 
  colors, 
  totalCount, 
  countLabel, 
  maxVisibleWeeks = 48 
}: HeatmapProps) {
  const totalWeeks = 53;
  const startWeek = Math.max(0, totalWeeks - maxVisibleWeeks);
  
  // Generate month labels for the visible range
  const generateMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = Math.floor(startWeek / 4.33); // Approximate weeks per month
    const visibleMonths = months.slice(startMonth, startMonth + Math.ceil(maxVisibleWeeks / 4.33));
    
    return visibleMonths.map((month, index) => (
      <div key={month} className="flex-none" style={{ width: `${index === visibleMonths.length - 1 && month === 'Dec' ? 5 * 16 : 4 * 16}px` }}>
        <div className="text-center">{month}</div>
      </div>
    ));
  };

  // Generate heatmap data
  const generateHeatmapWeeks = () => {
    // Create a map for quick lookup of data
    const dataMap = new Map();
    data.forEach(item => {
      const key = `${item.week}-${item.day}`;
      dataMap.set(key, item);
    });

    return Array.from({ length: Math.min(maxVisibleWeeks, totalWeeks) }, (_, index) => {
      const week = startWeek + index;
      return (
        <div key={week} className="flex flex-col gap-1">
          {Array.from({ length: 7 }, (_, day) => {
            const key = `${week}-${day}`;
            const dataPoint = dataMap.get(key);
            const intensity = dataPoint?.intensity ?? 0; // Default to 0 if no data point
            const tooltip = dataPoint?.tooltip ?? `No data`;
            
            return (
              <div
                key={`${week}-${day}`}
                className={`w-3 h-3 rounded-sm ${colors[intensity]} flex-none`}
                title={tooltip}
              ></div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalCount.toLocaleString()} {countLabel.toLowerCase()} in the last year
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {colors.map((color, index) => (
                  <div key={index} className={`w-3 h-3 ${color} rounded-sm`}></div>
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
          
          {/* Heatmap grid - GitHub style with months and days */}
          {(!data || data.length === 0) ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p>No data available for this time period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Month labels - sliding window approach */}
              <div className="flex gap-1 text-xs text-muted-foreground pl-8">
                {generateMonthLabels()}
              </div>
              
              {/* Heatmap with day labels */}
              <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
                  <div className="h-3"></div>
                  <div className="h-3 flex items-center">Mon</div>
                  <div className="h-3"></div>
                  <div className="h-3 flex items-center">Wed</div>
                  <div className="h-3"></div>
                  <div className="h-3 flex items-center">Fri</div>
                  <div className="h-3"></div>
                </div>
                
                {/* Heatmap grid - sliding window of weeks */}
                <div className="flex gap-1">
                  {generateHeatmapWeeks()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
