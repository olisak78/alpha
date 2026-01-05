import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useLinksSearchTerm, useLinksSelectedCategoryId, useLinksSearchFilterActions } from "@/stores/linksPageStore";
import { useLinksPageContext } from "@/contexts/LinksPageContext";

export const LinksSearchFilter = () => {
  // Search and filter state from Zustand
  const searchTerm = useLinksSearchTerm();
  const selectedCategoryId = useLinksSelectedCategoryId();
  const { setSearchTerm, setSelectedCategoryId } = useLinksSearchFilterActions();
  
  // Data from context (derived from API)
  const { linkCategories: categories } = useLinksPageContext();
  
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

    const scrollAmount = 300;
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
  }, [categories]); // Re-check when categories change

  return (
    <div className="bg-card border rounded-lg p-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
      {/* Search */}
      <div className="relative w-full lg:w-80 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search links..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-2 bg-muted/50 h-9"
        />
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-8 bg-border flex-shrink-0" />

      {/* Scrollable Category Pills Container */}
      <div className="relative w-full lg:flex-1 overflow-hidden">
        {/* Left Fade Gradient */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-background/95 border border-border shadow-sm hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 flex items-center justify-center",
            canScrollLeft 
              ? "opacity-100 pointer-events-auto" 
              : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Scrollable Pills */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* All Links Button */}
          <button
            onClick={() => {
              // If "All Links" is already selected, do nothing (it's the default state)
              // If another filter is selected, switch to "All Links"
              if (selectedCategoryId !== "all") {
                setSelectedCategoryId("all");
              }
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
              selectedCategoryId === "all"
                ? "bg-primary text-primary-foreground shadow-sm scale-105"
                : "bg-muted hover:bg-muted/80 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:border-gray-600/50"
            )}
          >
            All Links
          </button>

          {/* Category Pills */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                // If the category is already selected, deselect it and go back to "all"
                // If it's not selected, select it
                if (selectedCategoryId === category.id) {
                  setSelectedCategoryId("all");
                } else {
                  setSelectedCategoryId(category.id);
                }
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0",
                selectedCategoryId === category.id
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "bg-gray-50 hover:bg-gray-100 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600/50"
              )}
            >
              {category.icon && <category.icon className="h-3.5 w-3.5" />}
              {category.name}
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-background/95 border border-border shadow-sm hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 flex items-center justify-center",
            canScrollRight 
              ? "opacity-100 pointer-events-auto" 
              : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Right Fade Gradient */}
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};