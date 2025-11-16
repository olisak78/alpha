/**
 * Query Key Factory
 */

import type {
  TeamQueryParams,
  ComponentQueryParams,
  LandscapeQueryParams,
  ComponentDeploymentQueryParams,
  PaginationParams,
} from '../types/api';

export const queryKeys = {
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (params?: TeamQueryParams) =>
      [...queryKeys.teams.lists(), params] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    members: (teamId: string) => [...queryKeys.teams.all, 'members', teamId] as const,
  },

  // Updated members section in queryKeys

  members: {
    all: ['members'] as const,
    lists: () => [...queryKeys.members.all, 'list'] as const,
    list: (params?: Record<string, any>) => [...queryKeys.members.lists(), params] as const,
    details: () => [...queryKeys.members.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.members.details(), id] as const,
    currentUser: () => [...queryKeys.members.all, 'currentUser'] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Record<string, any>) => [...queryKeys.users.lists(), params] as const,
  },

  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (params?: PaginationParams) =>
      [...queryKeys.organizations.lists(), params] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    byName: (name: string) => [...queryKeys.organizations.all, 'by-name', name] as const,
  },

  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (params: { organization_id: string } & PaginationParams) =>
      [...queryKeys.groups.lists(), params] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
  },

  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params?: PaginationParams) =>
      [...queryKeys.projects.lists(), params] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  components: {
    all: ['components'] as const,
    lists: () => [...queryKeys.components.all, 'list'] as const,
    list: (params: ComponentQueryParams) =>
      [...queryKeys.components.lists(), params] as const,
    details: () => [...queryKeys.components.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.components.details(), id] as const,
    byTeam: (teamId: string) =>
      [...queryKeys.components.all, 'by-team', teamId] as const,
    byOrganization: (organizationId: string) =>
      [...queryKeys.components.all, 'by-organization', organizationId] as const,
    byProject: (projectName: string) =>
      [...queryKeys.components.all, 'by-project', projectName] as const,
  },

  landscapes: {
    all: ['landscapes'] as const,
    lists: () => [...queryKeys.landscapes.all, 'list'] as const,
    list: (params: LandscapeQueryParams) =>
      [...queryKeys.landscapes.lists(), params] as const,
    details: () => [...queryKeys.landscapes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.landscapes.details(), id] as const,
    byEnvironment: (environment: string, params: { organization_id: string } & PaginationParams) =>
      [...queryKeys.landscapes.all, 'environment', environment, params] as const,
    byProject: (projectName: string) =>
      [...queryKeys.landscapes.all, 'by-project', projectName] as const,
    withProjects: (id: string) =>
      [...queryKeys.landscapes.detail(id), 'projects'] as const,
    withDeployments: (id: string) =>
      [...queryKeys.landscapes.detail(id), 'deployments'] as const,
    withDetails: (id: string) =>
      [...queryKeys.landscapes.detail(id), 'full-details'] as const,
  },

  componentDeployments: {
    all: ['component-deployments'] as const,
    lists: () => [...queryKeys.componentDeployments.all, 'list'] as const,
    list: (params: ComponentDeploymentQueryParams) =>
      [...queryKeys.componentDeployments.lists(), params] as const,
    details: () => [...queryKeys.componentDeployments.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.componentDeployments.details(), id] as const,
    detailWithFull: (id: string) =>
      [...queryKeys.componentDeployments.detail(id), 'full-details'] as const,
  },

  health: {
    all: ['health'] as const,
    check: () => [...queryKeys.health.all, 'check'] as const,
    live: () => [...queryKeys.health.all, 'live'] as const,
    ready: () => [...queryKeys.health.all, 'ready'] as const,
  },

  jira: {
    all: ['jira'] as const,
    issues: {
      all: () => [...queryKeys.jira.all, 'issues'] as const,
      list: (params?: Record<string, any>) =>
        [...queryKeys.jira.issues.all(), 'list', params] as const,
    },
    myIssues: {
      all: () => [...queryKeys.jira.all, 'my-issues'] as const,
      list: (params?: Record<string, any>) =>
        [...queryKeys.jira.myIssues.all(), 'list', params] as const,
      count: (params: Record<string, any>) =>
        [...queryKeys.jira.myIssues.all(), 'count', params] as const,
    },
  },

  quickLinks: {
    all: ['quickLinks'] as const,
    byMember: (memberId: string) => [...queryKeys.quickLinks.all, memberId] as const,
  },

  github: {
    all: ['github'] as const,
    pullRequests: (params?: Record<string, any>) =>
      [...queryKeys.github.all, 'pull-requests', params] as const,
    contributions: () => [...queryKeys.github.all, 'contributions'] as const,
    averagePRTime: (period?: string) => [...queryKeys.github.all, 'average-pr-time', period] as const,
    heatmap: () => [...queryKeys.github.all, 'heatmap'] as const,
    prReviewComments: (period?: string) => [...queryKeys.github.all, 'pr-review-comments', period] as const,
  },

  sonar: {
    all: ['sonar'] as const,
    measures: (componentAlias: string | null) => [...queryKeys.sonar.all, 'measures', componentAlias] as const,
  },

  selfService: {
    all: ['self-service'] as const,
    jenkinsJobParameters: (jaasName: string, jobName: string) =>
      [...queryKeys.selfService.all, 'jenkins-job-parameters', jaasName, jobName] as const,
    jobStatus: () => ['selfService', 'jobStatus'] as const,
    queueStatus: (jaasName: string, queueItemId: string) =>
      ['selfService', 'queueStatus', jaasName, queueItemId] as const,
    buildStatus: (jaasName: string, jobName: string, buildNumber: number) =>
      ['selfService', 'buildStatus', jaasName, jobName, buildNumber] as const,
  },

  links: {
    all: ['links'] as const,
  },

  categories: {
    all: ['categories'] as const,
  },

  swagger: {
    all: ['swagger'] as const,
    byComponent: (componentId: string, landscapeName: string) =>
      [...queryKeys.swagger.all, 'component', componentId, landscapeName] as const,
  },
} as const;
