import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile";

function formatNow(isMobile: boolean): string {
  const now = new Date();
  try {
    if (isMobile) {
      // Shorter format for mobile: "dd/MM hh:mm"
      return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
    } else {
      // Full format for desktop
      return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,      
      }).format(now);
    }
  } catch {
    // Fallback if Intl options not supported
    return now.toLocaleString();
  }
}

export default function TopBarDateTime() {
  const isMobile = useIsMobile();
  const [nowString, setNowString] = useState<string>(formatNow(isMobile));

  useEffect(() => {
    const id = setInterval(() => setNowString(formatNow(isMobile)), 1000);
    return () => clearInterval(id);
  }, [isMobile]);

  return (
    <div className="inline-flex items-center gap-2 text-sm text-white select-none">
      <Clock className="h-4 w-4 text-white" aria-hidden="true" />
      <time aria-label="Current date and time" title={nowString}>{nowString}</time>
    </div>
  );
}
