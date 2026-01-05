import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Emerald", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Gray", value: "#6b7280" },
  // Additional 12 colors
  { name: "Light Blue", value: "#38bdf8" },
  { name: "Dark Blue", value: "#1e40af" },
  { name: "Light Green", value: "#4ade80" },
  { name: "Dark Green", value: "#15803d" },
  { name: "Light Purple", value: "#c084fc" },
  { name: "Dark Purple", value: "#7e22ce" },
  { name: "Light Pink", value: "#f9a8d4" },
  { name: "Dark Pink", value: "#be185d" },
  { name: "Light Orange", value: "#fb923c" },
  { name: "Dark Orange", value: "#c2410c" },
  { name: "Light Teal", value: "#2dd4bf" },
  { name: "Dark Teal", value: "#0f766e" },
];

interface TeamColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
  usedColors?: string[]; // Colors already used by other teams
}

export function TeamColorPicker({
  currentColor = "#6b7280",
  onColorChange,
  disabled = false,
  usedColors = [],
}: TeamColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setIsOpen(false);
  };

  const isColorUsed = (color: string) => {
    // Color is used if it's in usedColors and it's not the current team's color
    return usedColors.includes(color.toLowerCase()) && color.toLowerCase() !== currentColor?.toLowerCase();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 h-9"
        >
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: currentColor }}
          />
          <Palette className="h-3.5 w-3.5" />
          <span className="text-sm">Color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Choose a color</h4>
            <p className="text-xs text-muted-foreground">
              Select a color to identify your team's components
            </p>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => {
              const used = isColorUsed(color.value);
              return (
                <button
                  key={color.value}
                  onClick={() => !used && handleColorSelect(color.value)}
                  disabled={used}
                  className={cn(
                    "w-full aspect-square rounded-md border-2 transition-all relative",
                    currentColor === color.value
                      ? "border-foreground ring-2 ring-offset-2 ring-foreground"
                      : "border-transparent hover:border-border",
                    !used && "hover:scale-110",
                    used && "opacity-40 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={used ? `${color.name} (Used by another team)` : color.name}
                >
                  {used && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-0.5 h-full bg-white rotate-45 shadow-sm" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
