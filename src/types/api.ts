/**
 * API Type Definitions
 * 
 * These types are extracted from the Swagger/OpenAPI specification
 * and provide full type safety for all API interactions.
 * 
 * Organization:
 * - Enums (status types, component types, etc.)
 * - Base models (Team, Member, Organization, etc.)
 * - Request types (CreateTeamRequest, UpdateMemberRequest, etc.)
 * - Response types (TeamResponse, TeamListResponse, etc.)
 * - Utility types (PaginationParams, ApiError, etc.)
 */

// ============================================================================
// ENUMS - Standardized status and type values
// ============================================================================

/**
 * Team status values
 * Controls whether a team is active, inactive, or archived
 */
export enum TeamStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}

/**
 * Component status values
 * Tracks the lifecycle state of a component
 */
export enum ComponentStatus {
  Active = 'active',
  Inactive = 'inactive',
  Deprecated = 'deprecated',
  Maintenance = 'maintenance',
  Archived = 'archived'
}

/**
 * Component types
 * Categorizes what kind of component it is
 */
export enum ComponentType {
  Service = 'service',
  Library = 'library',
  Application = 'application',
  Database = 'database',
  API = 'api',
}

/**
 * Project status values
 */
export enum ProjectStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}

/**
 * Project types
 */
export enum ProjectType {
  Application = 'application',
  Service = 'service',
  Library = 'library',
  Platform = 'platform',
}

/**
 * Landscape types
 * Defines the environment type
 */
export enum LandscapeType {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Testing = 'testing',
  Preview = 'preview',
}

/**
 * Landscape status values
 */
export enum LandscapeStatus {
  Active = 'active',
  Inactive = 'inactive',
  Maintenance = 'maintenance',
  Retired = 'retired',
}

/**
 * Deployment status values
 * Tracks the health of a deployment
 */
export enum DeploymentStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Unknown = 'unknown',
}

// ============================================================================
// BASE MODELS - Core data structures
// ============================================================================

/**
 * Team Link model
 * Links associated with a team
 */
export interface TeamLink {
  category_id: string;
  description: string;
  favorite: boolean;
  id: string;
  name: string;
  tags: string[];
  title: string;
  url: string;
}

/**
 * Team Member model (different from general Member)
 * Represents a team member in the team response
 */
export interface TeamMember {
  created_at: string;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  metadata: Record<string, unknown>;
  mobile: string;
  team_domain: string;
  team_id: string;
  team_role: string;
  updated_at: string;
  uuid: string;
}

/**
 * Team Metadata interface
 * Defines the structure of team metadata
 */
export interface TeamMetadata {
  color?: string;
  jira?: {
    team?: string;
    'project-key'?: string;
    components?: string[];
    'board-id'?: string;
  };
  [key: string]: unknown;
}

/**
 * Team model
 * Represents a team within an organization/group
 */
export interface Team {
  created_at: string;
  description: string;
  email: string;
  group_id: string;
  id: string;
  links: TeamLink[];
  members: TeamMember[];
  metadata: TeamMetadata;
  name: string;
  organization_id: string;
  owner: string;
  picture_url: string;
  title: string;
  updated_at: string;
}

/**
 * Member model
 * Represents an individual team member
 * Supports both legacy and new structure fields
 */
export interface Member {
  name?: string; // Member identifier (e.g., "C5401691")
  team_name?: string; // Team name (e.g., "team-coe")
  team_domain?: string; // e.g., "developer"
  team_role?: string; // e.g., "member"
  phone_number?: string;
  portal_admin?: boolean;
  first_name: string;
  last_name: string;
  email: string;
  id?: string; // UUID
  full_name?: string;
  role?: string; // e.g., "developer", "manager", "designer"
  organization_id?: string; // UUID
  team_id?: string; // UUID (optional - member might not be on a team yet)
  created_at?: string; // ISO 8601 timestamp
  updated_at?: string; // ISO 8601 timestamp
  metadata?: {
    [key: string]: unknown;
  };
}

/**
 * User model
 * Represents a user from the users API endpoint
 */
export interface User {
  id: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Organization model
 */
export interface Organization {
  id: string; // UUID
  name: string; // Internal identifier
  display_name: string;
  description?: string;
  domain: string; // e.g., "example.com"
  created_at: string;
  updated_at: string;
}

/**
 * Group model
 * Groups contain teams
 */
export interface Group {
  id: string; // UUID
  name: string;
  display_name: string;
  description?: string;
  organization_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Project model
 */
export interface Project {
  id: string; // UUID
  name: string;
  title: string;
  description: string;
  isVisible?: boolean; // Controls visibility in sidebar
  alerts?: string;
  ops2go?: boolean;
  health?: {
    endpoint?: string;
  };
  monitoring?: boolean;
  deployment?: boolean;
  'components-metrics'?: boolean
}

/**
 * Component Link model
 * External links associated with a component
 */
export interface ComponentLink {
  URL: string;
  Icon: string;
  Title: string;
}

/**
 * Component Metadata model
 * Extended metadata for components including annotations and dependencies
 */
export interface ComponentMetadata {
  github?: {
    url: string;
  };
  tags?: string[];
  domain?: string;
  system?: string;
  lifecycle?: string;
  namespace?: string;
  depends_on?: string[];
  annotations?: Record<string, string>;
  consumes_apis?: string[];
  [key: string]: unknown;
}

/**
 * Component model
 * Updated to match the actual API response structure
 */
export interface Component {
  id: string; // UUID
  name: string;
  title: string;
  description: string;
  github?: string; // Direct GitHub URL
  qos?: string; // Quality of Service info
  sonar?: string; // Sonar dashboard URL
  owner_id: string; // UUID
  metadata?: ComponentMetadata;
  'is-library'?: boolean; // Indicates if component is a library
  health?: boolean;
  'central-service'?: boolean;
}


/**
 * Landscape model
 */
export interface Landscape {
  id: string; // UUID
  name: string;
  display_name: string;
  description?: string;
  organization_id: string;
  landscape_type: LandscapeType;
  status: LandscapeStatus;
  deployment_status: DeploymentStatus;
  environment_group?: string;
  aws_account_id?: string;
  github_config_url?: string;
  cam_profile_url?: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  title?: string;
  domain?: string;
  environment?: string;
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
}

/**
 * Component Deployment model
 * Represents a component deployed to a specific landscape
 */
export interface ComponentDeployment {
  id: string; // UUID
  component_id: string;
  landscape_id: string;
  version?: string;
  is_active: boolean;
  deployed_at?: string;
  git_commit_id?: string;
  git_commit_time?: string;
  build_time?: string;
  git_properties?: Record<string, unknown>;
  build_properties?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REQUEST TYPES - Data sent to API
// ============================================================================

/**
 * Create Team Request
 * Data required to create a new team
 */
export interface CreateTeamRequest {
  name: string; // min: 1, max: 100
  display_name: string; // max: 200
  description?: string;
  group_id: string; // UUID - required
  team_lead_id?: string; // UUID - optional
  status: TeamStatus; // required
  metadata?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

/**
 * Update Team Request
 * Data that can be updated on an existing team
 */
export interface UpdateTeamRequest {
  display_name: string; // required, max: 200
  description?: string;
  team_lead_id?: string; // UUID
  status?: TeamStatus;
  metadata?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

/**
 * Update Member Request
 * Data that can be updated on an existing member
 */
export interface UpdateMemberRequest {
  email?: string;
  external_type?: string;
  first_name?: string;
  full_name?: string;
  is_active?: boolean;
  iuser?: string;
  last_name?: string;
  metadata?: {
    developer_portal_role?: string;
    [key: string]: unknown;
  };
  phone_number?: string;
  role?: string;
  team_id?: string;
  team_role?: string;
}

/**
 * Create User Request
 * Data required to create a new user via the users endpoint
 */
export interface CreateUserRequest {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  mobile?: string; // optional
  team_domain?: string; // optional
  team_id: string;
  team_role?: string; // optional
}

/**
 * Create Organization Request
 */
export interface CreateOrganizationRequest {
  name: string; // required, min: 1, max: 100
  display_name: string; // required, max: 200
  domain: string; // required, max: 100
  description?: string;
}

/**
 * Update Organization Request
 */
export interface UpdateOrganizationRequest {
  display_name: string; // required, max: 200
  description?: string;
}

/**
 * Create Group Request
 */
export interface CreateGroupRequest {
  name: string; // required, min: 1, max: 100
  display_name: string; // required, max: 200
  organization_id: string; // UUID - required
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update Group Request
 */
export interface UpdateGroupRequest {
  name: string; // required, min: 1, max: 100
  display_name: string; // required, max: 200
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create Project Request
 */
export interface CreateProjectRequest {
  name: string; // required, min: 1, max: 200
  display_name: string; // required, max: 250
  organization_id: string; // UUID - required
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Update Project Request
 */
export interface UpdateProjectRequest {
  display_name: string; // required, max: 250
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create Component Request
 */
export interface CreateComponentRequest {
  name: string; // required, min: 1, max: 200
  display_name: string; // required, max: 250
  organization_id: string; // UUID - required
  description?: string;
  component_type?: ComponentType;
  status?: ComponentStatus;
  artifact_name?: string;
  group_name?: string;
  git_repository_url?: string;
  documentation_url?: string;
  metadata?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

/**
 * Update Component Request
 */
export interface UpdateComponentRequest {
  display_name: string; // required, max: 250
  description?: string;
  component_type?: ComponentType;
  status?: ComponentStatus;
  artifact_name?: string;
  group_name?: string;
  git_repository_url?: string;
  documentation_url?: string;
  metadata?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

/**
 * Create Landscape Request
 */
export interface CreateLandscapeRequest {
  name: string; // required, min: 1, max: 200
  display_name: string; // required, max: 250
  organization_id: string; // UUID - required
  description?: string;
  landscape_type?: LandscapeType;
  status?: LandscapeStatus;
  deployment_status?: DeploymentStatus;
  environment_group?: string;
  aws_account_id?: string;
  github_config_url?: string;
  cam_profile_url?: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Update Landscape Request
 */
export interface UpdateLandscapeRequest {
  display_name: string; // required, max: 250
  description?: string;
  landscape_type?: LandscapeType;
  status?: LandscapeStatus;
  deployment_status?: DeploymentStatus;
  environment_group?: string;
  aws_account_id?: string;
  github_config_url?: string;
  cam_profile_url?: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create Component Deployment Request
 */
export interface CreateComponentDeploymentRequest {
  component_id: string; // UUID - required
  landscape_id: string; // UUID - required
  version?: string;
  is_active?: boolean;
  deployed_at?: string;
  git_commit_id?: string;
  git_commit_time?: string;
  build_time?: string;
  git_properties?: Record<string, unknown>;
  build_properties?: Record<string, unknown>;
}

/**
 * Update Component Deployment Request
 */
export interface UpdateComponentDeploymentRequest {
  version?: string;
  is_active?: boolean;
  deployed_at?: string;
  git_commit_id?: string;
  git_commit_time?: string;
  build_time?: string;
  git_properties?: Record<string, unknown>;
  build_properties?: Record<string, unknown>;
}

export interface GitHubProviderContribution {
  provider_name: 'githubtools' | 'githubwdf';
  total_contributions: number;
}

export interface GitHubContributionsResponse {
  total_contributions: number;
  from: string;
  to: string;
  Providers: GitHubProviderContribution[];
}

// ============================================================================
// RESPONSE TYPES - Data received from API
// ============================================================================

/**
 * Generic paginated list response
 * Used for all list endpoints
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

/**
 * Team list response
 */
export interface TeamListResponse extends PaginatedResponse<Team> {
  teams: Team[];
}


/**
 * Users list response
 * Response structure from the /users endpoint
 */
export interface UsersListResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Organization list response
 */
export interface OrganizationListResponse extends PaginatedResponse<Organization> {
  organizations: Organization[];
}

/**
 * Group list response
 */
export interface GroupListResponse extends PaginatedResponse<Group> {
  groups: Group[];
}

/**
 * Project list response (no explicit type in Swagger, using generic)
 */
export type ProjectListResponse = PaginatedResponse<Project>;

/**
 * Component list response - unified for all component endpoints
 * Works for both full components and project-based components
 * Returns a direct array of components
 */
export type ComponentListResponse = Component[];

/**
 * Team Components list response
 * Specifically for team-related component endpoints
 */
export interface TeamComponentsListResponse {
  components: Component[];
}

/**
 * Landscape list response
 */
export interface LandscapeListResponse extends PaginatedResponse<Landscape> {
  landscapes: Landscape[];
}

/**
 * Component Deployment list response
 */
export interface ComponentDeploymentListResponse extends PaginatedResponse<ComponentDeployment> {
  deployments: ComponentDeployment[];
}

// ============================================================================
// UTILITY TYPES - Helper types for common patterns
// ============================================================================

/**
 * Pagination parameters
 * Used for list endpoints that support pagination
 */
export interface PaginationParams {
  page?: number; // Default: 1
  page_size?: number; // Default: 20
}

/**
 * Alternative pagination parameters (offset-based)
 * Used by members endpoint
 */
export interface OffsetPaginationParams {
  limit?: number; // Default: 20
  offset?: number; // Default: 0
}

/**
 * Search parameters
 * Used for endpoints that support search
 */
export interface SearchParams extends PaginationParams {
  search?: string;
}

/**
 * Team query parameters
 * Combines all possible query params for teams
 */
export interface TeamQueryParams {
  organization_id?: string; // Filter by organization
  page?: number;
  page_size?: number;
}


/**
 * Users query parameters
 * Parameters for the /users endpoint
 */
export interface UsersQueryParams {
  limit?: number;
  offset?: number;
}

/**
 * Component query parameters
 */
export interface ComponentQueryParams extends SearchParams {
  organization_id: string; // Required
}

/**
 * Landscape query parameters
 */
export interface LandscapeQueryParams extends SearchParams {
  organization_id: string; // Required
}

/**
 * Component Deployment query parameters
 */
export interface ComponentDeploymentQueryParams extends PaginationParams {
  component_id?: string;
  landscape_id?: string;
  // Note: API requires at least one of component_id or landscape_id
}

/**
 * API Error response
 * Standard error format returned by the API
 */
export interface ApiError {
  error?: string;
  message?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if a response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    ('error' in response || 'message' in response)
  );
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  services: Record<string, string>;
}

// ============================================================================
// JIRA TYPES - Jira integration related types
// ============================================================================

/**
 * Jira Issue model
 * Represents a single Jira issue from the new API
 */
export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      id: string;
      name: string;
    };
    issuetype: {
      id: string;
      name: string;
    };
    priority: {
      id: string;
      name: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    resolved?: string;
    description?: string;
    parent?: {
      id: string;
      key: string;
      fields: {
        summary: string;
        status: {
          id: string;
          name: string;
        };
        issuetype: {
          id: string;
          name: string;
        };
        priority: {
          id: string;
          name: string;
        };
      };
    };
    subtasks?: Array<{
      id: string;
      key: string;
      fields: {
        summary: string;
        status: {
          id: string;
          name: string;
        };
        issuetype: {
          id: string;
          name: string;
        };
        priority: {
          id: string;
          name: string;
        };
      };
    }>;
  };
  project: string;
  link: string;
}

/**
 * Jira Issues Response
 * Response from the new /jira/issues endpoints
 */
export interface JiraIssuesResponse {
  issues: JiraIssue[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Jira Issues Count Response
 * Response from the /jira/issues/me/count endpoint
 */
export interface JiraIssuesCountResponse {
  count: number;
}

/**
 * Jira Issues Query Parameters
 * Parameters for the new /jira/issues endpoint
 */
export interface JiraIssuesParams {
  project?: string; // Jira project key (e.g., SAPBTPCFS)
  status?: string; // Jira status values (e.g., 'Open,In Progress,Re Opened')
  team?: string; // Team name for filtering
  assignee?: string; // Filter by assignee name
  type?: string; // Filter by issue type (e.g., 'bug', 'task')
  summary?: string; // Filter by summary text
  key?: string; // Filter by issue key
  page?: number; // Page number (default: 1)
  limit?: number; // Number of items per page (default: 50, max: 100)
}

/**
 * My Jira Issues Query Parameters
 * Parameters for the /jira/issues/me endpoint
 */
export interface MyJiraIssuesParams {
  status?: string; // Jira status values (e.g., 'Open,In Progress')
  project?: string; // Jira project key (e.g., SAPBTPCFS)
  page?: number; // Page number (default: 1)
  limit?: number; // Number of items per page (default: 50, max: 100)
}

/**
 * My Jira Issues Count Parameters
 * Parameters for the /jira/issues/me/count endpoint
 */
export interface MyJiraIssuesCountParams {
  status: string; // Required - Jira status value (e.g., 'Resolved')
  project?: string; // Jira project key (e.g., SAPBTPCFS)
  date?: string; // Date in yyyy-MM-dd format for date filtering
}


export interface QuickLink {
  category: string;
  icon: string;
  title: string;
  url: string;
  description?: string;
}
export interface QuickLinksResponse {
  quick_links: QuickLink[];
}

export interface CreateQuickLinkRequest {
  category: string;
  icon: string;
  title: string;
  url: string;
  description?: string;
}
export interface GitHubContributionsResponse {
  total_contributions: number;
  period: string;
  from: string;
  to: string;
}

export interface GitHubPRReviewCommentsResponse {
  total_comments: number;
  period: string;
  from: string;
  to: string;
}

export interface SonarMeasure {
  metric: string;
  value: string;
  bestValue: boolean;
}

export interface SonarMeasuresResponse {
  measures: SonarMeasure[];
  status: string;
}

export interface SonarMetrics {
  coverage: number | null;
  codeSmells: number | null;
  vulnerabilities: number | null;
  qualityGate: 'Passed' | 'Failed' | null;
}

// ============================================================================
// JENKINS SELF-SERVICE TYPES - Jenkins job parameters and self-service
// ============================================================================

/**
 * Response type for Jenkins job parameters with steps structure
 */
export interface JenkinsJobParametersResponse {
  steps: JenkinsJobStep[];
}

/**
 * Jenkins job step containing multiple fields
 */
export interface JenkinsJobStep {
  name: string;
  title?: string;
  description?: string;
  fields?: JenkinsJobField[];
  isDynamic?: boolean;
}

/**
 * Default parameter value for different parameter types
 */
export interface JenkinsParameterValue {
  value: string | boolean | number;
}

/**
 * Individual Jenkins job field definition (renamed from JenkinsJobParameter)
 */
export interface JenkinsJobField {
  name: string;
  type: string;
  description?: string | null;
  defaultParameterValue?: JenkinsParameterValue;
}

export interface ApiLink {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  category_id: string;
  tags: string[];
}

/**
 * Category from API
 */
export interface ApiCategory {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Links API Response
 */
export type LinksApiResponse = ApiLink[];

/**
 * Categories API Response
 */
export interface CategoriesApiResponse {
  categories: ApiCategory[];
  total: number;
  page: number;
  page_size: number;
}
/**
 * User Link from /users/me endpoint
 */
export interface UserLink {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  category_id: string;
  tags: string[];
  favorite?: boolean;
}

/**
 * Response from /users/me endpoint
 */
export interface UserMeResponse {
  id: string;
  uuid: string;
  team_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  team_domain: string;
  team_role: string;
  link: UserLink[];
  portal_admin?: boolean;
}


export interface GitHubAveragePRTimeResponse {
  average_pr_merge_time_hours: number;
  pr_count: number;
  period: string;
  from: string;
  to: string;
  time_series: Array<{
    week_start: string;
    week_end: string;
    average_hours: number;
    pr_count: number;
  }>;
}
export interface StatItem {
  id: number;
  title: string;
  value: string | number;
  description?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  color?: string;
  isLoading?: boolean;
  isError?: boolean;
  chartData?: Array<{ value: number }>;
}

export interface GitHubHeatmapDay {
  date: string;
  contribution_count: number;
  contribution_level: string;
  color: string;
}

export interface GitHubHeatmapWeek {
  first_day: string;
  contribution_days: GitHubHeatmapDay[];
}

export interface GitHubHeatmapResponse {
  total_contributions: number;
  weeks: GitHubHeatmapWeek[];
  from: string;
  to: string;
}

// ============================================================================
// NEW USER SEARCH TYPES - New user search endpoint integration
// ============================================================================

/**
 * New User Search Result from API
 * Represents the actual response structure from the new API endpoint
 */
export interface NewUserSearchApiUser {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  mobile: string;
  new: boolean;
}

/**
 * New User Search Response from API
 */
export interface NewUserSearchApiResponse {
  result: NewUserSearchApiUser[];
}

/**
 * LDAP User Search Result (Legacy - kept for backward compatibility)
 * Represents a user found in search that can be added to a team
 * Normalized structure for UI consumption
 */
export interface LdapUser {
  cn: string; // Common name (user ID)
  displayName?: string;
  email?: string;
  givenName?: string;
  sn?: string; // Surname
}

/**
 * LDAP User Search Response (normalized)
 */
export interface LdapUserSearchResponse {
  users: LdapUser[];
  total: number;
}

/**
 * Project Interface List Response
 * Response structure for project interface list endpoints
 */
export interface ProjectResponse {
  projects: Project[];
}

// ============================================================================
// TRIGGERED ALERTS TYPES - Alert storage and triggered alerts
// ============================================================================

/**
 * Triggered Alert model
 * Represents a triggered alert from the alert storage API
 */
export interface TriggeredAlert {
  fingerprint: string;
  alertname: string;
  status: string;
  severity: string;
  landscape: string;
  region: string;
  startsAt: string;
  endsAt?: string;
  labels: Record<string, any>;
  annotations: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  component?: string
}

/**
 * Triggered Alerts Paginated Response
 * Response structure for triggered alerts endpoint with pagination
 */
export interface TriggeredAlertsResponse {
  data: TriggeredAlert[];
}

interface AlertLabel {
  key: string;
  value: string;
}

export interface TriggeredAlertsLabelUpdatePayload {
  fingerprint: string;
  label: AlertLabel;
  message?: string;
  project: string;
}

/**
 * Triggered Alerts Filters Response
 * Response structure for triggered alerts filters endpoint
 * All filter categories are optional arrays of strings
 */
export interface TriggeredAlertsFiltersResponse {
  alertname?: string[];
  landscape?: string[];
  region?: string[];
  severity?: string[];
  status?: string[];
  component?: string[];
}
