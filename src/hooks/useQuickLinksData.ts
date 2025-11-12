import { useMemo } from "react";
import { useQuickLinks } from "@/hooks/api/useQuickLinks";
import { useAuthWithRole } from "./useAuthWithRole";

export function useQuickLinksData() {
  const { user } = useAuthWithRole();
  const memberId = user?.memberId || null;

  const { data, isLoading, error } = useQuickLinks(memberId || '', {
    enabled: !!memberId,
  });

  const groupedLinks = useMemo(() => {
    if (!data?.quick_links) return {};

    return data.quick_links.reduce((acc, link) => {
      const category = link.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push(link);
      return acc;
    }, {} as Record<string, typeof data.quick_links>);
  }, [data]);

  const existingCategories = useMemo(() => {
    return Array.from(
      new Set(data?.quick_links?.map(link => link.category).filter(Boolean) || [])
    );
  }, [data]);

  return {
    memberId,
    data,
    isLoading,
    error,
    groupedLinks,
    existingCategories,
  };
}