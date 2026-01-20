import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useSearchTerm, useSelectedCategoryId, useSearchFilterActions } from "@/stores/quickLinksStore";
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";
import { ViewLinksToggleButton } from "@/components/Links/ViewLinksToggleButton";

interface QuickLinksSearchFilterProps {
  onAddLinkClick?: () => void;
}

export const QuickLinksSearchFilter = ({ onAddLinkClick }: QuickLinksSearchFilterProps) => {
  const searchTerm = useSearchTerm();
  const selectedCategoryId = useSelectedCategoryId();
  const { setSearchTerm, setSelectedCategoryId } = useSearchFilterActions();
  
  // Data from context (derived from API)
  const { linkCategories } = useQuickLinksContext();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update button visibility
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll left or right
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    const newScrollPosition = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });
  };

  // Handle mouse wheel scroll
  const handleWheel = (e: WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Prevent default vertical scroll
    e.preventDefault();

    // Scroll horizontally based on wheel delta
    container.scrollLeft += e.deltaY;
  };

  // Initial check and setup listeners
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    checkScroll();

    // Add scroll listener
    container.addEventListener('scroll', checkScroll);

    // Add mouse wheel listener for horizontal scrolling
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Add resize listener to handle window resizing
    const handleResize = () => {
      checkScroll();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      container.removeEventListener('scroll', checkScroll);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
    };
  }, [linkCategories]); // Re-check when categories change

  return (
    <div className="bg-card border rounded-lg p-2.5 flex flex-col gap-2.5">
      {/* Search and Add Link Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search quick links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border bg-muted/50 h-8 text-sm"
          />
        </div>
        {onAddLinkClick && (
          <Button
            size="sm"
            onClick={onAddLinkClick}
            className="h-8 whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        )}
        <ViewLinksToggleButton context="quicklinks" />
      </div>

      {/* Scrollable Category Pills Container */}
      <div className="relative w-full overflow-hidden">
        {/* Left Fade Gradient */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-0.5 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-background/95 border border-border shadow-sm hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 flex items-center justify-center",
            canScrollLeft 
              ? "opacity-100 pointer-events-auto" 
              : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Scrollable Pills */}
        <div
          ref={scrollContainerRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth px-0.5 py-0.5"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* All Links Button */}
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0",
              selectedCategoryId === "all"
                ? "bg-primary text-primary-foreground shadow-sm scale-105"
                : "bg-muted hover:bg-muted/80 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:border-gray-600/50"
            )}
          >
            All Links
          </button>

          {/* Category Pills */}
          {linkCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0",
                selectedCategoryId === category.id
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "bg-gray-50 hover:bg-gray-100 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600/50"
              )}
            >
              {category.icon && <category.icon className="h-3 w-3" />}
              {category.name}
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            "absolute right-0.5 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-background/95 border border-border shadow-sm hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 flex items-center justify-center",
            canScrollRight 
              ? "opacity-100 pointer-events-auto" 
              : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Right Fade Gradient */}
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};