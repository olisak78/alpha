// File: /src/utils/categoryIconMapping.ts
import { Cloud, Code, FileText, Link2, Monitor, Shield, TestTube, Users, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryMapping {
  icon: LucideIcon;
  color: string;
}

// Map category names to their icons and colors
export const categoryIconMap: Record<string, CategoryMapping> = {
  'CI/CD & Build': {
    icon: Code,
    color: 'bg-blue-500'
  },
  'Security & Compliance': {
    icon: Shield,
    color: 'bg-red-500'
  },
  'Monitoring & Observability': {
    icon: Monitor,
    color: 'bg-green-500'
  },
  'Project Management': {
    icon: Users,
    color: 'bg-purple-500'
  },
  'Documentation & Knowledge': {
    icon: FileText,
    color: 'bg-amber-500'
  },
  'Development Tools': {
    icon: Wrench,
    color: 'bg-indigo-500'
  },
  'Infrastructure & Cloud': {
    icon: Cloud,
    color: 'bg-cyan-500'
  },
  'Testing & QA': {
    icon: TestTube,
    color: 'bg-emerald-500'
  },
  'Community & Support': {
    icon: Link2,
    color: 'bg-orange-500'
  },
  // Default for any unmapped categories
  'Other': {
    icon: Link2,
    color: 'bg-gray-500'
  }
};

export function getCategoryMapping(categoryName: string): CategoryMapping {
  return categoryIconMap[categoryName] || categoryIconMap['Other'];
}