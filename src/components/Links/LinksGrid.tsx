import { LinkItem } from "./LinkItem";
import { useLinksPageContext } from "@/contexts/LinksPageContext";

export const LinksGrid = () => {
  const { filteredLinks } = useLinksPageContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredLinks.map((link) => (
        <LinkItem 
          key={link.id} 
          link={link}
        />
      ))}
    </div>
  );
};
