import { Member as DutyMember } from "@/hooks/useOnDutyData";

// Minimal shape of a component entry used here
export type ComponentEntry = { id: string; name: string };

export interface TeamLink {
  id: string;
  category_id: string;
  description: string;
  name: string;
  owner: string;
  tags: string;
  url: string;
  favorite?: boolean;
  isExpanded?: boolean;
}

export interface LinkFormData {
  title: string;
  url: string;
  existingCategory: string;
}

export interface TeamData {
  members: DutyMember[];
  ownership: Record<string, string[]>;
  links?: TeamLink[];
  name?: string;
}
