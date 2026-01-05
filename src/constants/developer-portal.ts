import { LinkFormData } from '@/components/Team/types';
import { Landscape, MacTool } from '@/types/developer-portal';

// Project-specific component configurations
export const projectComponents = {
  "CIS@2.0": [
    {
      id: "account-context-service",
      name: "Account Context Service",
      description: "Account context management and retrieval service",
      status: "healthy" as const,
      coverage: 88,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "accounts-service",
      name: "Accounts Service",
      description: "Account management and lifecycle service",
      status: "healthy" as const,
      coverage: 85,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "cis-cli-backend",
      name: "CIS CLI Backend",
      description: "Command line interface backend service",
      status: "healthy" as const,
      coverage: 78,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "cis-service-broker",
      name: "CIS Service Broker",
      description: "Service broker for CIS platform integration",
      status: "warning" as const,
      coverage: 72,
      vulnerabilities: 3,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    },
    {
      id: "cp-formations",
      name: "CP Formations",
      description: "Cloud platform formation management service",
      status: "healthy" as const,
      coverage: 82,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "cross-registry-service",
      name: "Cross Registry Service",
      description: "Cross-registry integration and synchronization",
      status: "healthy" as const,
      coverage: 90,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "entitlements-service",
      name: "Entitlements Service",
      description: "User entitlements and authorization service",
      status: "healthy" as const,
      coverage: 86,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "events-service",
      name: "Events Service",
      description: "Event handling and distribution service",
      status: "warning" as const,
      coverage: 75,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    },
    {
      id: "external-provider-registry",
      name: "External Provider Registry",
      description: "External service provider registration and management",
      status: "healthy" as const,
      coverage: 83,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "order-processing",
      name: "Order Processing",
      description: "Order processing and fulfillment service",
      status: "healthy" as const,
      coverage: 87,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "provisioning-service",
      name: "Provisioning Service",
      description: "Resource provisioning and lifecycle management",
      status: "healthy" as const,
      coverage: 89,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "task-management",
      name: "Task Management",
      description: "Task scheduling and execution management",
      status: "warning" as const,
      coverage: 76,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    }
  ],
  "Unified Services": [
    {
      id: "commercial-integration-manager",
      name: "Commercial Integration Manager",
      description: "Commercial integration management and coordination service",
      status: "healthy" as const,
      coverage: 85,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "controller-utils",
      name: "Controller Utils",
      description: "Shared utilities for controller services",
      status: "healthy" as const,
      coverage: 92,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    },
    {
      id: "core-controllers",
      name: "Core Controllers",
      description: "Core controller services and orchestration",
      status: "healthy" as const,
      coverage: 88,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "feature-toggle-client",
      name: "Feature Toggle Client",
      description: "Client library for feature toggle management",
      status: "healthy" as const,
      coverage: 90,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    },
    {
      id: "feature-toggle-manager",
      name: "Feature Toggle Manager",
      description: "Feature toggle management and configuration service",
      status: "healthy" as const,
      coverage: 87,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "healthcheck",
      name: "Healthcheck",
      description: "Health monitoring and status reporting service",
      status: "healthy" as const,
      coverage: 95,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "resources-server",
      name: "Resources Server",
      description: "Resource management and allocation server",
      status: "healthy" as const,
      coverage: 83,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "resources-server-api",
      name: "Resources Server API",
      description: "API gateway for resource server operations",
      status: "healthy" as const,
      coverage: 81,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "resources-server-client",
      name: "Resources Server Client",
      description: "Client library for resources server integration",
      status: "healthy" as const,
      coverage: 89,
      vulnerabilities: 0,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    },
    {
      id: "uctl",
      name: "UCTL",
      description: "Unified command line tool for system management",
      status: "warning" as const,
      coverage: 76,
      vulnerabilities: 3,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#"
      }
    },
    {
      id: "unified-account",
      name: "Unified Account",
      description: "Unified account management and authentication service",
      status: "healthy" as const,
      coverage: 86,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "unified-cloud-automation",
      name: "Unified Cloud Automation",
      description: "Cloud automation and deployment orchestration",
      status: "healthy" as const,
      coverage: 84,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "unified-service-orchestration",
      name: "Unified Service Orchestration",
      description: "Service orchestration and workflow management",
      status: "healthy" as const,
      coverage: 82,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "workspace-app",
      name: "Workspace App",
      description: "Workspace application and user interface",
      status: "healthy" as const,
      coverage: 78,
      vulnerabilities: 2,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    },
    {
      id: "workspace-server",
      name: "Workspace Server",
      description: "Workspace backend server and API services",
      status: "healthy" as const,
      coverage: 80,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    }
  ],
  "Cloud Automation": [
    {
      id: "cloud-automation-service",
      name: "Cloud Automation Service",
      description: "Core cloud automation and orchestration service",
      status: "healthy" as const,
      coverage: 85,
      vulnerabilities: 1,
      links: {
        jenkins: "#",
        github: "#",
        sonarqube: "#",
        swagger: "#"
      }
    }
  ]
};


// Mac tools catalog for New Mac Installation
export const MAC_TOOLS: MacTool[] = [
  { name: "TechSmith SnagIt", tags: ["Utilities"] },
  { name: "GlobalProtect", tags: ["Security"] },
  { name: "Microsoft Edge", tags: ["Browsers"] },
  { name: "Visual Studio Code", tags: ["IDEs"] },
  { name: "Microsoft PowerPoint", tags: ["Office"] },
  { name: "Scala", tags: ["CLI Tools"] },
  { name: "Docker", tags: ["CLI Tools"] },
  { name: "Go", tags: ["CLI Tools"] },
  { name: "Git", tags: ["CLI Tools"] },
  { name: "Node", tags: ["CLI Tools"] },
  { name: "Openjdk@8", tags: ["CLI Tools"] },
  { name: "Chrome", tags: ["Browsers"] },
  { name: "Intellij idea ultimate", tags: ["Development Tools", "IDEs", "GUI Tools"] },
  { name: "Apache Directory Studio", tags: ["GUI Tools"] },
  { name: "Microsoft Outlook", tags: ["Office"] },
  { name: "Kubelogin", tags: ["CLI Tools"] },
  { name: "Git credential manager", tags: ["GUI Tools"] },
  { name: "Postgresql", tags: ["CLI Tools"] },
  { name: "K9s", tags: ["CLI Tools"] },
  { name: "Microsoft Teams", tags: ["Office"] },
  { name: "Firefox", tags: ["Browsers"] },
  { name: "Gingko", tags: ["GUI Tools"] },
  { name: "Maven", tags: ["CLI Tools"] },
  { name: "Microsoft OneNote", tags: ["Office"] },
  { name: "Jq", tags: ["CLI Tools"] },
  { name: "Clipy", tags: ["GUI Tools", "Utilities"] },
  { name: "Citrix Workspace", tags: ["Utilities"] },
  { name: "Groovy SDK", tags: ["CLI Tools"] },
  { name: "Microsoft To-Do", tags: ["Office"] },
  { name: "Rectangle", tags: ["Utilities"] },
  { name: "Kustomize", tags: ["CLI Tools"] },
  { name: "Microsoft Excel", tags: ["Office"] },
  { name: "Helm", tags: ["CLI Tools"] },
  { name: "Windows app", tags: ["Usability"] },
  { name: "P4v", tags: ["GUI Tools"] },
  { name: "iTerm2", tags: ["CLI Tools"] },
  { name: "Kubebuilder", tags: ["CLI Tools"] },
  { name: "BBEdit", tags: ["Office"] },
  { name: "Kind", tags: ["CLI Tools"] },
  { name: "Microsoft OneDrive", tags: ["Office"] },
  { name: "Lens", tags: ["GUI Tools"] },
  { name: "Minikube", tags: ["CLI Tools"] },
  { name: "SAPMachine Manager", tags: ["Development"] },
  { name: "Go2shell", tags: ["GUI Tools", "Utilities"] },
  { name: "Atom", tags: ["GUI Tools"] },
  { name: "Microsoft Word", tags: ["Office"] },
];

export const getMacInstallSpec = (name: string): { type: "brew" | "cask" | "manual"; id?: string } => {
  const map: Record<string, { type: "brew" | "cask" | "manual"; id?: string }> = {
    "TechSmith SnagIt": { type: "cask", id: "snagit" },
    "GlobalProtect": { type: "cask", id: "globalprotect" },
    "Microsoft Edge": { type: "cask", id: "microsoft-edge" },
    "Visual Studio Code": { type: "cask", id: "visual-studio-code" },
    "Microsoft PowerPoint": { type: "cask", id: "microsoft-powerpoint" },
    "Scala": { type: "brew", id: "scala" },
    "Docker": { type: "cask", id: "docker" },
    "Go": { type: "brew", id: "go" },
    "Git": { type: "brew", id: "git" },
    "Node": { type: "brew", id: "node" },
    "Openjdk@8": { type: "brew", id: "openjdk@8" },
    "Chrome": { type: "cask", id: "google-chrome" },
    "Intellij idea ultimate": { type: "cask", id: "intellij-idea" },
    "Apache Directory Studio": { type: "cask", id: "apache-directory-studio" },
    "Microsoft Outlook": { type: "cask", id: "microsoft-outlook" },
    "Kubelogin": { type: "brew", id: "kubelogin" },
    "Git credential manager": { type: "brew", id: "git-credential-manager" },
    "Postgresql": { type: "brew", id: "postgresql" },
    "K9s": { type: "brew", id: "k9s" },
    "Microsoft Teams": { type: "cask", id: "microsoft-teams" },
    "Firefox": { type: "cask", id: "firefox" },
    "Gingko": { type: "manual" },
    "Maven": { type: "brew", id: "maven" },
    "Microsoft OneNote": { type: "cask", id: "microsoft-onenote" },
    "Jq": { type: "brew", id: "jq" },
    "Clipy": { type: "cask", id: "clipy" },
    "Citrix Workspace": { type: "cask", id: "citrix-workspace" },
    "Groovy SDK": { type: "brew", id: "groovy" },
    "Microsoft To-Do": { type: "cask", id: "microsoft-to-do" },
    "Rectangle": { type: "cask", id: "rectangle" },
    "Kustomize": { type: "brew", id: "kustomize" },
    "Microsoft Excel": { type: "cask", id: "microsoft-excel" },
    "Helm": { type: "brew", id: "helm" },
    "Windows app": { type: "manual" },
    "P4v": { type: "cask", id: "p4v" },
    "iTerm2": { type: "cask", id: "iterm2" },
    "Kubebuilder": { type: "brew", id: "kubebuilder" },
    "BBEdit": { type: "cask", id: "bbedit" },
    "Kind": { type: "brew", id: "kind" },
    "Microsoft OneDrive": { type: "cask", id: "onedrive" },
    "Lens": { type: "cask", id: "openlens" },
    "Minikube": { type: "brew", id: "minikube" },
    "SAPMachine Manager": { type: "manual" },
    "Go2shell": { type: "manual" },
    "Atom": { type: "manual" },
    "Microsoft Word": { type: "cask", id: "microsoft-word" },
  };
  return map[name] || { type: "manual" };
};

// Mock health and alerts data per component per landscape
export const mockHealthData = {
  "account-context-service": { "multi-i501817": "UP", "cf-cn20-staging": "DOWN", "cf-i502552": "UP", "cf-live": "UP" },
  "accounts-service": { "multi-i501817": "UP", "cf-cn20-staging": "UP", "cf-i502552": "DOWN", "cf-live": "UP" },
  "cis-cli-backend": { "multi-i501817": "DOWN", "cf-cn20-staging": "UP", "cf-i502552": "UP", "cf-live": "UP" },
  "cis-service-broker": { "multi-i501817": "UP", "cf-cn20-staging": "UP", "cf-i502552": "UP", "cf-live": "DOWN" },
};

export const mockAlertsData = {
  "account-context-service": { "multi-i501817": false, "cf-cn20-staging": true, "cf-i502552": false, "cf-live": false },
  "accounts-service": { "multi-i501817": false, "cf-cn20-staging": false, "cf-i502552": true, "cf-live": false },
  "cis-cli-backend": { "multi-i501817": true, "cf-cn20-staging": false, "cf-i502552": false, "cf-live": false },
  "cis-service-broker": { "multi-i501817": false, "cf-cn20-staging": false, "cf-i502552": false, "cf-live": true },
};

export const navKeyToPath: Record<string, string> = {
  "CIS@2.0": "cis",
  "Unified Services": "unified-services",
  "Cloud Automation": "cloud-automation"
};

export const categoryOptions = ["Infrastructure", "Access", "Lifestyle", "Equipment"];

export const defaultLinkForm: LinkFormData = {
  title: "",
  url: "",
  existingCategory: ""
};

// Valid common tab values - these must match the Team component's tab values
export const VALID_COMMON_TABS = ['overview', 'components', 'schedule', 'jira', 'docs'];
export const DEFAULT_COMMON_TAB = 'overview';
export const ERROR_MESSAGES = {
  FULL_NAME_REQUIRED: "Full name is required",
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  ROLE_REQUIRED: "Role is required",
  TEAM_REQUIRED: "Team is required",
  AVATAR_INVALID: "Please enter a valid URL",
}
export const PLACEHOLDERS = {
  FULL_NAME: "Enter full name",
  EMAIL: "Enter email address",
  ROLE: "e.g., Frontend Engineer, Product Manager",
  TEAM: "Select a team",
  AVATAR: "https://example.com/avatar.jpg"
}

// Storage keys for persistent state
export const STORAGE_KEYS = {
  CURRENT_DEV: "currentDeveloperId",
  SELECTED_LANDSCAPE: "selectedLandscape",
  TIMELINE_VIEW_MODE: "timelineViewMode",
} as const;

// Get backend URL from runtime environment or fallback to localhost for development
export const getNewBackendUrl = (): string => {
  return typeof window !== 'undefined' 
    ? (window.env?.BACKEND_URL || 'http://localhost:7008')
    : 'http://localhost:7008';
};

export const DEFAULT_PAGE_SIZE=100;
export const DEFAULT_LANDSCAPE='cf-us10-staging';
export const QUICK_ACCESS_TAB_KEY = 'homepage-quick-access-tab';
export type SortField = 'key' | 'summary' | 'status' | 'priority' | 'updated';
export type SortOrder = 'asc' | 'desc';

export const STORAGE_KEY = 'landscape_history';
export const MAX_HISTORY_SIZE = 5;

export interface LandscapeHistoryItem {
  id: string;
  timestamp: number;
}

export const LANDSCAPE_GROUP_ORDER = ['staging', 'integrate', 'canary', 'hotfix', 'live'];


