import { Badge } from "../ui/badge";
import { useLinksPageContext } from "@/contexts/LinksPageContext";

export function LinksHeader() {
  const { filteredLinks } = useLinksPageContext();
  const numOfLinks = filteredLinks.length;

  return (
    <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Important Links</h2>
        </div>
        <Badge variant="outline" className="text-sm">
          {numOfLinks} {numOfLinks === 1 ? 'link' : 'links'}
        </Badge>
      </div>
  );
}
