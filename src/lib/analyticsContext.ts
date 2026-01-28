/**
 * Analytics Context Utility
 * 
 * Provides user and project context for analytics events
 */

import { sessionManager } from './sessionManager';

/**
 * Get current user information from session
 */
export function getCurrentUserForAnalytics(): {
  userId?: string;
  userName?: string;
  email?: string;
  organization?: string;
} | null {
  return sessionManager.getUserInfo();
}

/**
 * Get current project name from URL
 * Extracts project from pathname like /cis20/components or /teams/platform-engineering
 */
export function getCurrentProjectFromUrl(): string | null {
  const pathname = window.location.pathname;
  
  // Handle special cases
  if (pathname === '/' || pathname === '/home') return 'Home';
  if (pathname.startsWith('/teams')) return 'Teams';
  if (pathname.startsWith('/links')) return 'Links';
  if (pathname.startsWith('/self-service')) return 'Self Service';
  if (pathname.startsWith('/ai-arena')) return 'AI Arena';
  if (pathname.startsWith('/plugin-marketplace') || pathname.startsWith('/plugins')) return 'Plugin Marketplace';
  
  // Extract first path segment for project pages
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    return pathSegments[0];
  }
  
  return null;
}

/**
 * Get enriched analytics data with user and project context
 */
export function getAnalyticsContext(): {
  userId?: string;
  userName?: string;
  email?: string;
  organization?: string;
  projectName?: string | null;
} {
  const userInfo = getCurrentUserForAnalytics();
  const projectName = getCurrentProjectFromUrl();
  
  return {
    ...userInfo,
    projectName,
  };
}