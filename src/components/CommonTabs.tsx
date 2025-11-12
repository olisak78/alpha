import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface CommonTabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabsListClassName?: string;
  tabsContentClassName?: string;
  additionalHeaderContent?: ReactNode;
  headerPosition?: "left" | "right" | "between";
}

export default function CommonTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className = "",
  tabsListClassName = "",
  tabsContentClassName = "mt-6",
  additionalHeaderContent,
  headerPosition = "right"
}: CommonTabsProps) {
  const firstTabValue = tabs[0]?.value || "";
  
  // Determine if this should be controlled or uncontrolled
  const isControlled = value !== undefined;
  const effectiveDefaultValue = defaultValue || firstTabValue;

  const renderHeader = () => {
    if (!additionalHeaderContent) {
      return <TabsList className={tabsListClassName}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>;
    }

    if (headerPosition === "left") {
      return (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            {additionalHeaderContent}
            <TabsList className={tabsListClassName}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
      );
    }

    if (headerPosition === "between") {
      return (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <TabsList className={tabsListClassName}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {additionalHeaderContent}
          </div>
        </div>
      );
    }

    // Default: right position
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <TabsList className={tabsListClassName}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {additionalHeaderContent}
      </div>
    );
  };

  // Use controlled or uncontrolled mode properly
  const tabsProps = isControlled 
    ? { value, onValueChange }
    : { defaultValue: effectiveDefaultValue };

  return (
    <div className={className}>
      <Tabs {...tabsProps}>
        {renderHeader()}

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className={tabsContentClassName}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
