export interface ToolCategory {
  id: string;
  label: string;
  tools: string[]; // tool IDs matching the ToolButton type
}

export const LANDSCAPE_TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'development',
    label: 'Development',
    tools: ['git', 'vault', 'concourse']
  },
  {
    id: 'cam',
    label: 'Cam',
    tools: ['cam']
  },
  {
    id: 'cad',
    label: 'CAD & Workspace',
    tools: ['cad','workspace']
  },
  {
    id: 'monitoring',
    label: 'Monitoring & Observability',
    tools: ['dynatrace', 'applicationLogging', 'platformLogging']
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    tools: ['plutono', 'gardener', 'iaasConsole', 'iaasConsoleBS']
  },
  {
    id: 'management',
    label: 'Management & Operations',
    tools: ['cockpit', 'operationConsole', 'controlCenter', 'avs']
  },
  {
    id: 'misc',
    label: 'Miscellaneous',
    tools: ['kibana']
  }
];

/**
 * Helper function to get the category for a specific tool
 */
export function getToolCategory(toolId: string): string | null {
  for (const category of LANDSCAPE_TOOL_CATEGORIES) {
    if (category.tools.includes(toolId)) {
      return category.id;
    }
  }
  return null;
}

/**
 * Helper function to check if a separator should be shown before a tool
 * Returns true if this is the first tool of a new category
 */
export function shouldShowSeparator(
  currentToolId: string,
  previousToolId: string | null
): boolean {
  if (!previousToolId) return false;

  const currentCategory = getToolCategory(currentToolId);
  const previousCategory = getToolCategory(previousToolId);

  // Show separator if we're moving to a new category
  return currentCategory !== null && currentCategory !== previousCategory;
}