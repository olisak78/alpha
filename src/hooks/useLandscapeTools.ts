import { useMemo } from 'react';

interface LandscapeData {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
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

    // Removed fallback to static JSON - now only use API landscape data
    const landscape = landscapeData;

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
    const gitUrl = landscape.git || null;
    const concourseUrl = landscape.concourse || null;
    const kibanaUrl = landscape.kibana || null;
    const dynatraceUrl = landscape.dynatrace || null;
    const cockpitUrl = landscape.cockpit || null;
    const plutonoUrl = landscape.plutono || null;

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