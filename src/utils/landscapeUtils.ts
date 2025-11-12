import { Landscape } from '@/types/developer-portal';

export function getDefaultLandscape(landscapes: Landscape[]): string | null {
  if (!landscapes || landscapes.length === 0) {
    return null;
  }

  // Try to find "Israel (Tel Aviv)" landscape
  const israelLandscape = landscapes.find(
    l => l.name === 'Israel (Tel Aviv)' || l.name.toLowerCase().includes('israel') || l.name.toLowerCase().includes('tel aviv')
  );

  if (israelLandscape) {
    return israelLandscape.id;
  }

  // Return first landscape if Israel not found
  return landscapes[0].id;
}