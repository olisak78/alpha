import { apiClient } from './ApiClient';

export interface LandscapeInfo {
  // Identity & Description
  'CE-onboarded'?: boolean;
  description?: string;
  displayname_full?: string;
  domain?: string;
  type?: string;

  // Consoles & Dashboards
  'IaaS-console'?: string;
  'IaaS-console-BS'?: string;
  'IaaS-console-CONN01'?: string;
  cockpit?: string;
  'apm-infra-environment'?: string;
  'avs-aggregated-monitor'?: string;

  // CAM Profiles
  'cam-profile-devod'?: string;
  'cam-profile-exchmgt'?: string;

  // Repository & Documentation
  'landscape-repository'?: string;

  // Network & Infrastructure
  jumpbox?: string;
  jumpbox2?: string;
  jumpbox_ipv6?: string;
  jumpbox2_ipv6?: string;
  'lb-ips'?: string;
  'lb-ips_ipv6'?: string;
  'nat-ips'?: string;
  'trial-nat-ips'?: string;
  'ugw-lb-ips'?: string;
  dynatrace_ips?: string;
  ipv6_cidr_blocks?: string;

  // Account Information
  'hyperscaler-account-id'?: string;
  'hyperscaler-account-id-BS'?: string;
  'hyperscaler-account-id-CONN01'?: string;
  'iaas-account-alias'?: string;

  // Region & Location
  region?: string;

  // Ownership & Communication
  owner?: string;
  'slack-channel'?: string;

  // Status & Configuration
  state?: string;
  'cflinuxfs-status'?: string;
  'ccf-universe'?: string;
  'trial-enabled'?: boolean | string;

  // Security & Restrictions
  access_restrictions?: string;
  workload_restrictions?: string;
  private_domain?: boolean | string;
}

export interface CentralLandscapesData {
  [landscapeName: string]: LandscapeInfo;
}

export interface Ops2goResponse {
  data: CentralLandscapesData;
  responseTime: number;
  statusCode: number;
  success: boolean;
}

export async function fetchCentralLandscapes(): Promise<Ops2goResponse> {
  return apiClient.get<Ops2goResponse>('/cis-public/ops2go/centrallandscapes');
}
