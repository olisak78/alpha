import { useMemo } from 'react';
import landscapesData from '@/data/landscapes/landscapes.json';

interface LandscapeData {
  id?: string;
  name?: string;
  domain?: string;
  landscape_url?: string;
  'landscape-repository'?: string;
  'apm-infra-environment'?: string;
  metadata?: {
    domain?: string;
    'landscape-repository'?: string;
    'apm-infra-environment'?: string;
  };
}

interface LandscapeToolUrls {
  git: string | null;
  concourse: string | null;
  kibana: string | null;
  dynatrace: string | null;
  cockpit: string | null;
  plutono: string | null;
}

interface LandscapeToolsAvailability {
  git: boolean;
  concourse: boolean;
  kibana: boolean;
  dynatrace: boolean;
  cockpit: boolean;
  plutono: boolean;
}

interface UseLandscapeToolsReturn {
  urls: LandscapeToolUrls;
  availability: LandscapeToolsAvailability;
}

export function useLandscapeTools(
  selectedLandscapeId: string | null,
  landscapeData?: LandscapeData | null
): UseLandscapeToolsReturn {
  return useMemo(() => {
    // Default state when no landscape is selected
    if (!selectedLandscapeId) {
      return {
        urls: {
          git: null,
          concourse: null,
          kibana: null,
          dynatrace: null,
          cockpit: null,
          plutono: null
        },
        availability: {
          git: false,
          concourse: false,
          kibana: false,
          dynatrace: false,
          cockpit: false,
          plutono: false
        },
      };
    }

    // Prefer API landscape data if provided, otherwise fallback to static JSON
    let landscape: LandscapeData | undefined = landscapeData || undefined;

    // Fallback to static JSON if no API data provided
    if (!landscape) {
      landscape = landscapesData[selectedLandscapeId as keyof typeof landscapesData] as LandscapeData | undefined;
    }

    // If landscape not found, return disabled state
    if (!landscape) {
      return {
        urls: {
          git: null,
          concourse: null,
          kibana: null,
          dynatrace: null,
          cockpit: null,
          plutono: null
        },
        availability: {
          git: false,
          concourse: false,
          kibana: false,
          dynatrace: false,
          cockpit: false,
          plutono: false
        },
      };
    }

    // Get the domain from the landscape data (check multiple possible locations)
    const domain = landscape.landscape_url || landscape.domain || landscape.metadata?.domain || '';

    // Build URLs from the landscape data (check metadata if top-level fields don't exist)
    const gitUrl = landscape['landscape-repository'] || landscape.metadata?.['landscape-repository'] || null;
    const concourseUrl = domain ? `https://concourse.cf.${domain}/teams/product-cf/pipelines/landscape-update-pipeline` : null;
    const kibanaUrl = domain ? `https://logs.cf.${domain}/app/dashboards#/view/Requests-and-Logs` : null;
    const dynatraceUrl = landscape['apm-infra-environment'] || landscape.metadata?.['apm-infra-environment'] || null;
    const cockpitUrl = domain ? `https://cockpit.${domain}` : null;
    const plutonoUrl = 'https://plutono.ingress.btp-mnt-ca.btp.shoot.live.k8s-hana.ondemand.com/?orgId=1'

    return {
      urls: {
        git: gitUrl,
        concourse: concourseUrl,
        kibana: kibanaUrl,
        dynatrace: dynatraceUrl,
        cockpit: cockpitUrl,
        plutono: plutonoUrl
      },
      availability: {
        git: !!gitUrl,
        concourse: !!concourseUrl,
        kibana: !!kibanaUrl,
        dynatrace: !!dynatraceUrl,
        cockpit: !!cockpitUrl,
        plutono: !!plutonoUrl
      },
    };
  }, [selectedLandscapeId, landscapeData]);
}