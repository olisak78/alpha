import React, { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";

export interface CustomDateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface DateRangePickerProps {
    value: CustomDateRange;
    onChange: (range: CustomDateRange) => void;
    onClear?: () => void;
    className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value,
    onChange,
    onClear,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempRange, setTempRange] = useState<DateRange | undefined>(() => {
        if (value.from || value.to) {
            return { from: value.from, to: value.to };
        }
        return undefined;
    });

    const handleSelect = (range: DateRange | undefined) => {
        setTempRange(range);
    };

    const handleApply = () => {
        if (tempRange) {
            onChange({ from: tempRange.from, to: tempRange.to });
        } else {
            onChange({ from: undefined, to: undefined });
        }
        setIsOpen(false);
    };

    const handleCancel = () => {
        // Reset to current value
        if (value.from || value.to) {
            setTempRange({ from: value.from, to: value.to });
        } else {
            setTempRange(undefined);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        setTempRange(undefined);
        onChange({ from: undefined, to: undefined });
        if (onClear) {
            onClear();
        }
        setIsOpen(false);
    };

    const formatDateRange = () => {
        if (!value.from) return "Custom Range";
        if (!value.to) return `From ${value.from.toLocaleDateString()}`;
        return `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`;
    };

    const hasSelection = value.from || value.to;

    return (

        <div className={cn("relative inline-flex items-center", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={hasSelection ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "gap-2 justify-start text-left font-normal min-w-[180px] pr-7",
                            !hasSelection && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        <span className="truncate">{formatDateRange()}</span>
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                        <div className="text-sm font-medium">Select date range</div>
                        <DayPicker
                            mode="range"
                            selected={tempRange}
                            onSelect={handleSelect}
                            numberOfMonths={1}
                            disabled={{ after: new Date() }}
                            showOutsideDays={false}
                            className="rdp-custom"


                        />
                        <div className="flex items-center justify-between gap-2 pt-3 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClear}
                                className="flex-1"
                            >
                                Clear
                            </Button>
                            <div className="flex gap-2 flex-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleApply}
                                    disabled={!tempRange?.from}
                                    className="flex-1"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {hasSelection && (
                <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear date range"
                    className="
                            absolute right-1.5 top-1/2 -translate-y-1/2
                            h-5 w-5
                            rounded-full
                            bg-white/25
                            hover:bg-white/40
                            flex items-center justify-center
                            transition
                        "
                >
                    <X className="h-3.5 w-3.5 text-white" />
                </button>
            )}
        </div>



    );
};