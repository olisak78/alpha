import { LucideIcon } from "lucide-react";

interface MetricItemProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
  isLoading: boolean;
}

export function MetricItem({ 
  icon: Icon, 
  iconColor, 
  value, 
  label, 
  isLoading 
}: MetricItemProps) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
      <Icon className={`h-3.5 w-3.5 mb-1 ${iconColor}`} />
      <span className="font-semibold text-xs truncate max-w-full">
        {isLoading ? '...' : value}
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}
