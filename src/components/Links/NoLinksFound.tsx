import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export const NoLinksFound = () => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No links found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search terms or category filter
        </p>
      </CardContent>
    </Card>
  );
};
