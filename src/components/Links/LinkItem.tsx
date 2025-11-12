import { Link } from "@/types/developer-portal";
import { UnifiedLinkCard } from "./UnifiedLinkCard";
import { useLinksPageContext } from "@/contexts/LinksPageContext";

interface LinkItemProps {
  link: Link;
}

export const LinkItem = ({ link }: LinkItemProps) => {
  const { linkCategories, handleToggleFavorite } = useLinksPageContext();

  // Find the category for this link
  const category = linkCategories.find(cat => cat.id === link.categoryId);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleFavorite(link.id);
  };

  return (
    <UnifiedLinkCard
      linkData={link}
      variant="full"
    />
  );
};
