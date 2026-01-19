/**
 * Maps GitHub hostnames to provider names
 */
const GITHUB_PROVIDER_MAP: Record<string, string> = {
  'github.tools.sap': 'githubtools',
  'github.wdf.sap.corp': 'githubwdf',
  'github.com': 'github',
  // Add more providers as needed
};

/**
 * Extract provider name from GitHub URL hostname
 * @param url - Full GitHub URL
 * @returns Provider name (e.g., "githubtools", "githubwdf")
 */
export function extractGitHubProvider(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const provider = GITHUB_PROVIDER_MAP[parsedUrl.hostname];
    
    if (!provider) {
      throw new Error(`Unknown GitHub provider: ${parsedUrl.hostname}`);
    }
    
    return provider;
  } catch (error) {
    console.error('Failed to extract GitHub provider:', error);
    throw new Error('Invalid GitHub URL');
  }
}

/**
 * Get GitHub hostname from provider name
 * @param provider - Provider name (e.g., "githubtools")
 * @returns GitHub hostname
 */
export function getGitHubHostname(provider: string): string {
  const entry = Object.entries(GITHUB_PROVIDER_MAP).find(
    ([, value]) => value === provider
  );
  
  if (!entry) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  return entry[0];
}

/**
 * Validate if hostname is a supported GitHub provider
 * @param hostname - URL hostname
 * @returns True if supported
 */
export function isValidGitHubProvider(hostname: string): boolean {
  return hostname in GITHUB_PROVIDER_MAP;
}

/**
 * Get all supported GitHub providers
 * @returns Array of provider names
 */
export function getSupportedProviders(): string[] {
  return Object.values(GITHUB_PROVIDER_MAP);
}