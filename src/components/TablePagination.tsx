import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export default function TablePagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange,
  itemsPerPage = 10 
}: TablePaginationProps) {
  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>
            Page {currentPage} of {totalPages} ({totalItems} total items)
          </>
        ) : (
          'No items'
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          disabled={currentPage <= 1} 
          onClick={handlePrevious}
        >
          Prev
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={currentPage >= totalPages} 
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
