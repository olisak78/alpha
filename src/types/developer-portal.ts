// Types for the Developer Portal components
import { ComponentType, ComponentStatus, ComponentLink, ComponentMetadata } from '@/types/api';

export interface Component {
  id: string; // UUID
  name: string;
  display_name: string;
  description?: string;
  status: ComponentStatus;
  group_name?: string;
  git_repository_url?: string;
  documentation_url?: string;
  links?: ComponentLink[];
  metadata?: ComponentMetadata;
  created_at: string;
  updated_at: string;
  coverage?: number;
  vulnerabilities?: number;
  legacyLinks?: {
    jenkins?: string;
    github?: string;
    sonarqube?: string;
    swagger?: string;
  };
}

export interface Landscape {
  id: string;
  name: string;
  status: "active" | "inactive";
  githubConfig: string;
  awsAccount: string;
  camProfile: string;
  deploymentStatus: "deployed" | "deploying" | "failed";
  technical_name?: string;
  environment?: string;
  metadata?: Record<string, any>;
  title?: string;
  domain?: string;
  git?: string;
  concourse?: string;
  kibana?: string;
  dynatrace?: string;
  cockpit?: string;
  'operation-console'?: string;
  type?: string;
  grafana?: string;
  prometheus?: string;
  gardener?: string;
  plutono?: string;
  landscape_url?: string; 
  isCentral?: boolean;
}

export interface FeatureToggle {
  id: string;
  name: string;
  component: string;
  description: string;
  landscapes: Record<string, boolean>;
}

export interface SelfServiceBlock {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
}

export interface SelfServiceStepElement {
  id: string;
  title: string;
  type: 'checkbox' | 'radio' | 'select' | 'text';  
  isMultiSelect?: boolean;
  description?: string;
  options?: {
    id: string;
    label: string;
    value: string | boolean;
  }[];
  defaultValue?: {
    id: string;
    value: string | boolean;
  };
  placeholder?: string;
}

export interface SelfServiceStep {
  id: string;
  title: string;
  description?: string;
  stepNumber: number;
  elements: SelfServiceStepElement[];
  nextStepId: string | null;
  prevStepId: string | null;
  isLastStep: boolean;
}

export interface SelfServiceWizardData {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  icon?: string;
  steps: SelfServiceStep[];
}

export interface RateLimitRule {
  id: string;
  method: string;
  period: number;
  requestsLimit: number;
  endpoint: string;
  identityType: string;
  componentId: string;
  landscapes: Record<string, boolean>;
}

export interface LogLevelChange {
  logger: string;
  oldLevel: string;
  newLevel: string;
  loggerName: string;
}

export interface MacTool {
  name: string;
  tags: string[];
}

export interface Link {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string;
  tags: string[];
  favorite: boolean;
}

export type LinkCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
};

export interface DeveloperPortalProps {
  activeProject: string;
  onProjectChange: (project: string) => void;
}


// Import component version data
import accountsServiceData from '@/data/cis-components/accounts-service.json';
import billingServiceData from '@/data/cis-components/billing-service.json';
import orderServiceData from '@/data/cis-components/order-service.json';
import paymentServiceData from '@/data/cis-components/payment-service.json';
import notificationServiceData from '@/data/cis-components/notification-service.json';
import userServiceData from '@/data/cis-components/user-service.json';
import { LucideIcon } from 'lucide-react';

// // Mock log levels across landscapes
// export const mockLogLevelsAcrossLandscapes = {
//   "com.sap.core": {
//     "cf-eu10": "INFO",
//     "cf-us10": "INFO", 
//     "cf-ap10": "INFO",
//     "cf-eu20-integrate": "DEBUG",
//     "cf-us10-integrate": "DEBUG",
//     "cf-cn40-canary": "INFO",
//     "cf-eu10-canary": "INFO"
//   },
//   "com.sap.core.commercial": {
//     "cf-eu10": "INFO",
//     "cf-us10": "WARN",
//     "cf-ap10": "INFO", 
//     "cf-eu20-integrate": "INFO",
//     "cf-us10-integrate": "INFO",
//     "cf-cn40-canary": "WARN",
//     "cf-eu10-canary": "INFO"
//   },
//   "com.sap.core.commercial.common": {
//     "cf-eu10": "TRACE",
//     "cf-us10": "TRACE",
//     "cf-ap10": "TRACE",
//     "cf-eu20-integrate": "TRACE", 
//     "cf-us10-integrate": "TRACE",
//     "cf-cn40-canary": "TRACE",
//     "cf-eu10-canary": "TRACE"
//   },
//   "com.sap.core.commercial.common.appconfiguration": {
//     "cf-eu10": "ERROR",
//     "cf-us10": "ERROR",
//     "cf-ap10": "WARN",
//     "cf-eu20-integrate": "ERROR",
//     "cf-us10-integrate": "DEBUG", 
//     "cf-cn40-canary": "ERROR",
//     "cf-eu10-canary": "ERROR"
//   },
//   "com.sap.core.commercial.common.appconfiguration.service": {
//     "cf-eu10": "DEBUG",
//     "cf-us10": "INFO",
//     "cf-ap10": "DEBUG",
//     "cf-eu20-integrate": "TRACE",
//     "cf-us10-integrate": "DEBUG",
//     "cf-cn40-canary": "DEBUG", 
//     "cf-eu10-canary": "DEBUG"
//   },
//   "com.sap.core.commercial.common.appconfiguration.service.AppConfigurationService": {
//     "cf-eu10": "INFO",
//     "cf-us10": "INFO",
//     "cf-ap10": "INFO",
//     "cf-eu20-integrate": "INFO",
//     "cf-us10-integrate": "INFO",
//     "cf-cn40-canary": "INFO",
//     "cf-eu10-canary": "INFO"
//   },
//   "com.sap.core.commercial.common.async": {
//     "cf-eu10": "WARN",
//     "cf-us10": "ERROR", 
//     "cf-ap10": "WARN",
//     "cf-eu20-integrate": "DEBUG",
//     "cf-us10-integrate": "WARN",
//     "cf-cn40-canary": "WARN",
//     "cf-eu10-canary": "INFO"
//   }
// };

// Component version data mapping
export const componentVersions = {
  'accounts-service': accountsServiceData,
  'billing-service': billingServiceData,
  'order-service': orderServiceData,
  'payment-service': paymentServiceData,
  'notification-service': notificationServiceData,
  'user-service': userServiceData
};

export type LayoutDirection = 'horizontal' | 'vertical'
export const DEFAULT_LANDSCAPE = 'cf-us10-staging'

export type ViewLinksType = 'collapsed' | 'expanded';

// Types for authentication
export interface User {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider: 'githubtools';
  memberId?:string;
  team_role?: string;
  portal_admin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
export interface AuthWithRoleContextType extends AuthContextType {
  memberError?: Error | null;
}

export interface QuickLinkFormData {
  category: string;
  icon: string;
  title: string;
  url: string;
}

export const defaultFormData: QuickLinkFormData = {
  category: '',
  icon: 'link',
  title: '',
  url: '',
};

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
}

export interface GitHubRepository {
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: GitHubUser;
  repository: GitHubRepository;
  draft: boolean;
}

export interface GitHubPullRequestsResponse {
  pull_requests: GitHubPullRequest[];
  total: number;
}

export interface GitHubPRQueryParams {
  state?: 'open' | 'closed' | 'all';
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface LandscapeToolUrls {
  git: string | null;
  concourse: string | null;
  kibana: string | null;
  dynatrace: string | null;
}

export interface LandscapeToolsAvailability {
  git: boolean;
  concourse: boolean;
  kibana: boolean;
  dynatrace: boolean;
}

export interface UseLandscapeToolsReturn {
  urls: LandscapeToolUrls;
  availability: LandscapeToolsAvailability;
}
