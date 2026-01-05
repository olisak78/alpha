import { getDefaultLandscapeId } from '@/services/LandscapesApi';
import type { Landscape } from '@/types/developer-portal';

// Mock landscape data for testing
const createMockLandscape = (
  id: string,
  technicalName: string,
  environment: string,
  isCentral: boolean = false
): Landscape => ({
  id,
  name: technicalName,
  technical_name: technicalName,
  status: 'active',
  githubConfig: '#',
  awsAccount: id,
  cam: '',
  deploymentStatus: 'deployed',
  environment,
  isCentral,
});

describe('getDefaultLandscapeId', () => {
  it('should return null for empty landscapes array', () => {
    const result = getDefaultLandscapeId([]);
    expect(result).toBeNull();
  });

  it('should prefer staging environment with isCentral=true', () => {
    const landscapes = [
      createMockLandscape('1', 'prod-landscape', 'production', false),
      createMockLandscape('2', 'staging-central', 'staging', true),
      createMockLandscape('3', 'dev-landscape', 'development', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('2');
  });

  it('should fallback to project-specific staging pattern when no central staging exists', () => {
    const landscapes = [
      createMockLandscape('1', 'prod-landscape', 'production', false),
      createMockLandscape('2', 'myproject-staging', 'staging', false),
      createMockLandscape('3', 'dev-landscape', 'development', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('2');
  });

  it('should match staging-{projectname} pattern', () => {
    const landscapes = [
      createMockLandscape('1', 'prod-landscape', 'production', false),
      createMockLandscape('2', 'staging-myproject', 'staging', false),
      createMockLandscape('3', 'dev-landscape', 'development', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('2');
  });

  it('should fallback to any staging landscape when no project-specific staging exists', () => {
    const landscapes = [
      createMockLandscape('1', 'prod-landscape', 'production', false),
      createMockLandscape('2', 'some-staging', 'staging', false),
      createMockLandscape('3', 'dev-landscape', 'development', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('2');
  });

  it('should fallback to first landscape when no staging exists', () => {
    const landscapes = [
      createMockLandscape('1', 'prod-landscape', 'production', false),
      createMockLandscape('2', 'dev-landscape', 'development', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('1');
  });

  it('should work without projectName parameter', () => {
    const landscapes = [
      createMockLandscape('1', 'prod-landscape', 'production', false),
      createMockLandscape('2', 'staging-central', 'staging', true),
    ];

    const result = getDefaultLandscapeId(landscapes);
    expect(result).toBe('2');
  });

  it('should handle case-insensitive project name matching', () => {
    const landscapes = [
      createMockLandscape('1', 'MyProject-Staging', 'staging', false),
      createMockLandscape('2', 'other-landscape', 'production', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('1');
  });

  it('should match partial project name patterns', () => {
    const landscapes = [
      createMockLandscape('1', 'cf-myproject-staging-eu', 'staging', false),
      createMockLandscape('2', 'other-landscape', 'production', false),
    ];

    const result = getDefaultLandscapeId(landscapes, 'myproject');
    expect(result).toBe('1');
  });
});
