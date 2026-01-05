/**
 * Backend Entity Interfaces *
 **/

// Base interfaces for common patterns
interface BaseEntity {
  id: string; 
  createdAt: Date;
}

interface UpdatableEntity extends BaseEntity {
  updatedAt: Date;
}

interface OrganizationOwnedEntity extends UpdatableEntity {
  organizationId: string; 
}

interface MetadataEntity extends UpdatableEntity {
  metadata: Record<string, any>; 
}

interface OrganizationMetadataEntity extends OrganizationOwnedEntity {
  metadata: Record<string, any>; 
}

interface NamedEntity {
  name: string;
  displayName: string;
  description?: string;
}

interface StatusEntity {
  status: string;
}

// Core domain entities
export interface Organization extends UpdatableEntity, NamedEntity, MetadataEntity {
  domain: string; 
}

export interface Project extends OrganizationMetadataEntity, NamedEntity, StatusEntity {
  projectType: string;
  sortOrder: number;
}

export interface Team extends OrganizationMetadataEntity, NamedEntity, StatusEntity {
  teamLeadId: string; 
  links: Record<string, any>; 
}

export interface Member extends OrganizationMetadataEntity {
  teamId: string; 
  fullName: string;
  email: string; 
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  externalType?: string;
  githubUsername?: string;
  jiraUsername?: string;
}

export interface Component extends OrganizationMetadataEntity, NamedEntity, StatusEntity {
  componentType: string;
  groupName?: string;
  artifactName?: string;
  gitRepositoryUrl?: string;
  documentationUrl?: string;
  links: Record<string, any>; 
}

export interface Landscape extends OrganizationMetadataEntity, NamedEntity, StatusEntity {
  landscapeType: string;
  environmentGroup: string;
  deploymentStatus: string;
  githubConfigUrl?: string;
  awsAccountId?: string;
  camProfileUrl?: string;
  sortOrder: number;
}

// Deployment and tracking entities
export interface ComponentDeployment extends BaseEntity {
  componentId: string; 
  landscapeId: string; 
  version: string;
  gitCommitId: string;
  gitCommitTime: Date;
  buildTime: Date;
  buildProperties: Record<string, any>; 
  gitProperties: Record<string, any>; 
  isActive: boolean;
  deployedAt: Date;
}

export interface DeploymentTimeline extends OrganizationMetadataEntity {
  landscapeId: string; 
  timelineCode: string;
  timelineName: string;
  scheduledDate: Date; 
  isCompleted: boolean;
  statusIndicator?: string;
}

// Relationship/junction entities
export interface ProjectComponent extends BaseEntity {
  projectId: string; 
  componentId: string; 
  ownershipType: string;
  sortOrder: number;
}

export interface ProjectLandscape extends BaseEntity {
  projectId: string; 
  landscapeId: string; 
  landscapeGroup: string;
  sortOrder: number;
}

export interface TeamComponentOwnership extends BaseEntity {
  teamId: string; 
  componentId: string; 
  ownershipType: string;
}

// Duty and incident management entities
export interface DutySchedule extends OrganizationMetadataEntity {
  teamId: string; 
  memberId: string; 
  scheduleType: string;
  year: number;
  startDate: Date; 
  endDate: Date; 
  shiftType: string;
  wasCalled: boolean;
  notes?: string;
}

export interface OutageCall extends OrganizationMetadataEntity {
  teamId: string; 
  callTimestamp: Date;
  year: number;
  description?: string;
  severity: string;
  resolutionTimeMinutes: number;
}

export interface OutageCallAssignee extends BaseEntity {
  outageCallId: string; 
  memberId: string; 
  responseTimeMinutes: number;
}