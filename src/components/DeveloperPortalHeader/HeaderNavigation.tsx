import { HeaderTab } from "@/contexts/HeaderNavigationContext";
import { HeaderDropdown } from "./HeaderDropdown";
import { HeaderTabsList } from "./HeaderTabsList";

interface HeaderNavigationProps {
  tabs: HeaderTab[];
  activeTab: string | null;
  onTabClick: (tabId: string) => void;
  isDropdown?: boolean;
}

export function HeaderNavigation({ tabs, activeTab, onTabClick, isDropdown = false }: HeaderNavigationProps) {
  if (tabs.length === 0) {
    return null;
  }

  if (isDropdown) {
    return (
      <HeaderDropdown
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={onTabClick}
      />
    );
  }

  return (
    <HeaderTabsList
      tabs={tabs}
      activeTab={activeTab}
      onTabClick={onTabClick}
    />
  );
}
