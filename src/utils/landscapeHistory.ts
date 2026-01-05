import { LandscapeHistoryItem, MAX_HISTORY_SIZE, STORAGE_KEY } from "@/constants/developer-portal";

export function getLandscapeHistory(): LandscapeHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as LandscapeHistoryItem[];
  } catch (error) {
    console.error('Error reading landscape history:', error);
    return [];
  }
}

export function addToLandscapeHistory(landscapeId: string): void {
  try {
    const history = getLandscapeHistory();
    
    // Remove existing entry for this landscape if it exists
    const filtered = history.filter(item => item.id !== landscapeId);
    
    // Add new entry at the beginning
    const newHistory: LandscapeHistoryItem[] = [
      { id: landscapeId, timestamp: Date.now() },
      ...filtered
    ].slice(0, MAX_HISTORY_SIZE); // Keep only last 5
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error saving landscape history:', error);
  }
}

export function clearLandscapeHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing landscape history:', error);
  }
}