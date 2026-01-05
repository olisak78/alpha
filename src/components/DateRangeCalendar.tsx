import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type DateRangeCalendarProps = React.ComponentProps<typeof DayPicker>;

function DateRangeCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DateRangeCalendarProps) {
  
  // Create modifiers for enhanced styling
  const modifiers = React.useMemo(() => {
    const selected = (props as any).selected;
    if (!selected || typeof selected !== 'object' || !selected.from) {
      return {};
    }

    const modifiersObj: any = {};
    
    if (selected.from) {
      modifiersObj.range_start = selected.from;
    }
    
    if (selected.to) {
      modifiersObj.range_end = selected.to;
      
      // Create array of dates between start and end for middle range
      if (selected.from && selected.to && selected.from < selected.to) {
        const middleDates = [];
        const current = new Date(selected.from);
        current.setDate(current.getDate() + 1);
        
        while (current < selected.to) {
          middleDates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        
        if (middleDates.length > 0) {
          modifiersObj.range_middle = middleDates;
        }
      }
    }
    
    return modifiersObj;
  }, [(props as any).selected]);

  const modifiersStyles = {
    range_start: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: '600',
      borderRadius: '6px 0 0 6px',
      boxShadow: '0 0 0 2px hsl(var(--primary) / 0.5), 0 1px 3px 0 rgb(0 0 0 / 0.1)',
      position: 'relative' as const,
    },
    range_end: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: '600',
      borderRadius: '0 6px 6px 0',
      boxShadow: '0 0 0 2px hsl(var(--primary) / 0.5), 0 1px 3px 0 rgb(0 0 0 / 0.1)',
      position: 'relative' as const,
    },
    range_middle: {
      backgroundColor: 'hsl(var(--primary) / 0.3)',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: '500',
    },
  };

  return (
    <>
      <style>{`
        /* Position navigation buttons on both sides of month label */
        .date-range-calendar .rdp-month_caption {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding-top: 0.25rem !important;
          margin-bottom: 1rem !important;
          position: relative !important;
        }
        
        .date-range-calendar .rdp-nav {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          pointer-events: none !important;
        }
        
        .date-range-calendar .rdp-button_previous {
          position: absolute !important;
          left: 0 !important;
          top: 0.75rem !important;
          pointer-events: auto !important;
        }
        
        .date-range-calendar .rdp-button_next {
          position: absolute !important;
          right: 0 !important;
          top: 0.75rem !important;
          pointer-events: auto !important;
        }
        
        .date-range-calendar .rdp-month_caption span {
          text-align: center !important;
          flex: 1 !important;
          z-index: 1 !important;
          position: relative !important;
        }
        
        /* Fix alignment of week headers with table cells */
        .date-range-calendar .rdp-weekdays {
          display: flex;
        }
        
        .date-range-calendar .rdp-weekday {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: normal;
          color: hsl(var(--muted-foreground));
          border-radius: 6px;
        }
        
        .date-range-calendar .rdp-day[data-selected="true"] {
          position: relative;
        }
        
        .date-range-calendar .rdp-day[data-selected="true"]::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: hsl(var(--primary));
          border-radius: 50%;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          z-index: 10;
        }
        
        .date-range-calendar .rdp-day_range_start {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 600 !important;
          border-radius: 6px 0 0 6px !important;
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5), 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
        }
        
        .date-range-calendar .rdp-day_range_end {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 600 !important;
          border-radius: 0 6px 6px 0 !important;
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5), 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
        }
        
        .date-range-calendar .rdp-day_range_middle {
          background-color: hsl(var(--primary) / 0.3) !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 500 !important;
        }
      `}</style>
      
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3 date-range-calendar", className)}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        classNames={{
          months: "flex flex-col",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 h-9 font-normal text-[0.8rem] flex items-center justify-center",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative"
          ),
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold",
          day_today: "bg-accent text-accent-foreground font-semibold",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </>
  );
}
DateRangeCalendar.displayName = "DateRangeCalendar";

export { DateRangeCalendar };
