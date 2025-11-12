import { apiClient } from './ApiClient';

/**
 * Add a link to user's favorites
 * 
 * @param userId - User UUID
 * @param linkId - Link ID to favorite
 */
export async function addFavorite(userId: string, linkId: string): Promise<void> {
  return apiClient.post<void>(`/users/${userId}/favorites/${linkId}`);
}

/**
 * Remove a link from user's favorites
 * 
 * @param userId - User UUID
 * @param linkId - Link ID to unfavorite
 */
export async function removeFavorite(userId: string, linkId: string): Promise<void> {
  return apiClient.delete<void>(`/users/${userId}/favorites/${linkId}`);
}