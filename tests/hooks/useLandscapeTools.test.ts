import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLandscapeTools } from '../../src/hooks/useLandscapeTools';

describe('useLandscapeTools', () => {
  it('should return disabled state when no landscape is selected', () => {
    const { result } = renderHook(() => useLandscapeTools(null));

    expect(result.current.urls.git).toBe(null);
    expect(result.current.urls.concourse).toBe(null);
    expect(result.current.urls.kibana).toBe(null);
    expect(result.current.urls.dynatrace).toBe(null);
    expect(result.current.urls.cockpit).toBe(null);
    expect(result.current.urls.plutono).toBe(null);
    expect(result.current.urls.operationConsole).toBe(null);
    expect(result.current.urls.controlCenter).toBe(null);

    expect(result.current.availability.git).toBe(false);
    expect(result.current.availability.concourse).toBe(false);
    expect(result.current.availability.kibana).toBe(false);
    expect(result.current.availability.dynatrace).toBe(false);
    expect(result.current.availability.cockpit).toBe(false);
    expect(result.current.availability.plutono).toBe(false);
    expect(result.current.availability.operationConsole).toBe(false);
    expect(result.current.availability.controlCenter).toBe(false);
  });

  it('should use direct URLs from landscape data', () => {
    const landscapeData = {
      id: "e177a3bb-e87e-4818-b2b2-8728173799a8",
      name: "cf-ae01",
      title: "UAE (Dubai)",
      description: "UAE (Dubai) SAP Cloud Infrastructure",
      domain: "ae01.hana.ondemand.com",
      environment: "live",
      git: "https://github.tools.sap/cf-live-realm/cf-ae01-landscape",
      concourse: "https://concourse.cf.ae01.hana.ondemand.com/teams/product-cf/pipelines/landscape-update-pipeline",
      kibana: "https://logs.cf.ae01.hana.ondemand.com/app/dashboards#/view/Requests-and-Logs",
      dynatrace: "https://live.ae1.apm.services.cloud.sap/e/c76f031a-1922-4004-9388-7a50aec8e5ff",
      cockpit: "https://cockpit.btp.cloud.sap",
      "operation-console": "https://operator.operationsconsole.cfapps.ae01.hana.ondemand.com",
      type: "ccee"
    };

    const { result } = renderHook(() =>
      useLandscapeTools('cf-ae01', landscapeData)
    );

    expect(result.current.urls.git).toBe("https://github.tools.sap/cf-live-realm/cf-ae01-landscape");
    expect(result.current.urls.concourse).toBe("https://concourse.cf.ae01.hana.ondemand.com/teams/product-cf/pipelines/landscape-update-pipeline");
    expect(result.current.urls.kibana).toBe("https://logs.cf.ae01.hana.ondemand.com/app/dashboards#/view/Requests-and-Logs");
    expect(result.current.urls.dynatrace).toBe("https://live.ae1.apm.services.cloud.sap/e/c76f031a-1922-4004-9388-7a50aec8e5ff");
    expect(result.current.urls.cockpit).toBe("https://cockpit.btp.cloud.sap");
    expect(result.current.urls.plutono).toBe(null);

    expect(result.current.availability.git).toBe(true);
    expect(result.current.availability.concourse).toBe(true);
    expect(result.current.availability.kibana).toBe(true);
    expect(result.current.availability.dynatrace).toBe(true);
    expect(result.current.availability.cockpit).toBe(true);
    expect(result.current.availability.plutono).toBe(false);
  });

  it('should disable buttons when URL fields are missing', () => {
    const landscapeData = {
      id: "test-landscape",
      name: "test-landscape-1",
      title: "Test Landscape",
      domain: "test.example.com",
      git: "https://github.example.com/test",
      concourse: "https://concourse.test.example.com/pipeline",
      // kibana is missing - should be disabled
      // dynatrace is missing - should be disabled
      cockpit: "https://cockpit.test.example.com"
    };

    const { result } = renderHook(() =>
      useLandscapeTools('test-landscape-1', landscapeData)
    );

    expect(result.current.urls.git).toBe("https://github.example.com/test");
    expect(result.current.urls.concourse).toBe("https://concourse.test.example.com/pipeline");
    expect(result.current.urls.kibana).toBe(null);
    expect(result.current.urls.dynatrace).toBe(null);
    expect(result.current.urls.cockpit).toBe("https://cockpit.test.example.com");

    expect(result.current.availability.git).toBe(true);
    expect(result.current.availability.concourse).toBe(true);
    expect(result.current.availability.kibana).toBe(false);
    expect(result.current.availability.dynatrace).toBe(false);
    expect(result.current.availability.cockpit).toBe(true);
  });

  // CHANGED: Test for empty string fields - buttons should be disabled
  it('should disable buttons when URL fields are empty strings', () => {
    const landscapeData = {
      id: "test-landscape",
      name: "test-landscape-1",
      git: "https://github.example.com/test",
      concourse: "",  // Empty string - should be disabled
      kibana: "",     // Empty string - should be disabled
      dynatrace: "https://dynatrace.example.com",
      cockpit: ""     // Empty string - should be disabled
    };

    const { result } = renderHook(() =>
      useLandscapeTools('test-landscape-1', landscapeData)
    );

    expect(result.current.availability.git).toBe(true);
    expect(result.current.availability.concourse).toBe(false);
    expect(result.current.availability.kibana).toBe(false);
    expect(result.current.availability.dynatrace).toBe(true);
    expect(result.current.availability.cockpit).toBe(false);
  });

  it('should return disabled state when landscape not found', () => {
    const { result } = renderHook(() =>
      useLandscapeTools('test-landscape-1', null)
    );

    const defaultDisabledState = {
      urls: {
        git: null,
        concourse: null,
        kibana: null,
        dynatrace: null,
        cockpit: null,
        plutono: null,
        operationConsole: null,
        controlCenter: null,
        cam: null,
        gardener: null
      },
      availability: {
        git: false,
        concourse: false,
        kibana: false,
        dynatrace: false,
        cockpit: false,
        plutono: false,
        operationConsole: false,
        controlCenter: false,
        cam: false,
        gardener: false
      },
    };

    expect(result.current).toEqual(defaultDisabledState);
  });

  it('should handle control-center URL correctly', () => {
    const landscapeData = {
      id: "test-landscape",
      name: "test-landscape-1",
      title: "Test Landscape",
      domain: "test.example.com",
      git: "https://github.example.com/test",
      'control-center': "https://control-center.test.example.com",
      'operation-console': "https://ops.test.example.com"
    };

    const { result } = renderHook(() =>
      useLandscapeTools('test-landscape-1', landscapeData)
    );

    expect(result.current.urls.controlCenter).toBe("https://control-center.test.example.com");
    expect(result.current.urls.operationConsole).toBe("https://ops.test.example.com");
    expect(result.current.availability.controlCenter).toBe(true);
    expect(result.current.availability.operationConsole).toBe(true);
  });

  it('should disable control-center when URL is missing or empty', () => {
    const landscapeDataMissing = {
      id: "test-landscape",
      name: "test-landscape-1",
      git: "https://github.example.com/test"
      // control-center is missing
    };

    const { result: resultMissing } = renderHook(() =>
      useLandscapeTools('test-landscape-1', landscapeDataMissing)
    );

    expect(resultMissing.current.urls.controlCenter).toBe(null);
    expect(resultMissing.current.availability.controlCenter).toBe(false);

    const landscapeDataEmpty = {
      id: "test-landscape",
      name: "test-landscape-1",
      git: "https://github.example.com/test",
      'control-center': ""  // Empty string
    };

    const { result: resultEmpty } = renderHook(() =>
      useLandscapeTools('test-landscape-1', landscapeDataEmpty)
    );

    expect(resultEmpty.current.urls.controlCenter).toBe(null);
    expect(resultEmpty.current.availability.controlCenter).toBe(false);
  });
  it('should use direct URLs from Unified Services landscape data', () => {
    const landscapeData = {
      id: "79711b4b-c012-44e4-a713-33569ffe8a8d",
      name: "canary",
      title: "Canary",
      description: "Canary",
      domain: "canary.urm-eu10c.shoot.live.k8s-hana.ondemand.com",
      environment: "preview",
      git: "https://github.tools.sap/atom-cfs/landscape-canary",
      kibana: "https://kibana-sf-da016a0c-111f-4230-9b5f-e0e3a00e085d.cls-02.cloud.logs.services.eu10.hana.ondemand.com/app/dashboards#/view/maintained-by-perfx_k8s-content-package_K8s-Overview",
      grafana: "https://graf.ingress.canary.urm-eu10c.shoot.live.k8s-hana.ondemand.com/",
      prometheus: "https://p-urm-eu10c--canary.ingress.eu5.aws.seed.live.k8s.ondemand.com/",
      gardener: "https://dashboard.garden.live.k8s.ondemand.com/namespace/garden-urm-eu10c/shoots/canary/",
      plutono: "https://graf.ingress.canary.urm-eu10c.shoot.live.k8s-hana.ondemand.com"
    };

    const { result } = renderHook(() =>
      useLandscapeTools('canary', landscapeData)
    );

    // Unified Services uses git, kibana, and plutono
    expect(result.current.urls.git).toBe("https://github.tools.sap/atom-cfs/landscape-canary");
    expect(result.current.urls.kibana).toBe("https://kibana-sf-da016a0c-111f-4230-9b5f-e0e3a00e085d.cls-02.cloud.logs.services.eu10.hana.ondemand.com/app/dashboards#/view/maintained-by-perfx_k8s-content-package_K8s-Overview");
    expect(result.current.urls.plutono).toBe("https://graf.ingress.canary.urm-eu10c.shoot.live.k8s-hana.ondemand.com");

    // CIS-specific fields should be null for Unified Services
    expect(result.current.urls.concourse).toBe(null);
    expect(result.current.urls.dynatrace).toBe(null);
    expect(result.current.urls.cockpit).toBe(null);

    // Check availability
    expect(result.current.availability.git).toBe(true);
    expect(result.current.availability.kibana).toBe(true);
    expect(result.current.availability.plutono).toBe(true);
    expect(result.current.availability.concourse).toBe(false);
    expect(result.current.availability.dynatrace).toBe(false);
    expect(result.current.availability.cockpit).toBe(false);
  });

  // Updated test to reflect new behavior
  it('should update result when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ selectedLandscapeId, landscapeData }) =>
        useLandscapeTools(selectedLandscapeId, landscapeData),
      {
        initialProps: {
          selectedLandscapeId: 'test-landscape-1',
          landscapeData: {
            git: "https://github.example.com/first",
            concourse: "https://concourse.first.example.com/pipeline"
          }
        }
      }
    );

    const firstResult = result.current;

    // Change landscapeData
    rerender({
      selectedLandscapeId: 'test-landscape-1',
      landscapeData: {
        git: "https://github.example.com/second",
        concourse: "https://concourse.second.example.com/pipeline"
      }
    });

    expect(result.current).not.toBe(firstResult);
    expect(result.current.urls.git).toBe("https://github.example.com/second");
    expect(result.current.urls.concourse).toBe("https://concourse.second.example.com/pipeline");
  });
});
