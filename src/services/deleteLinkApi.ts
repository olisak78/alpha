import { apiClient } from './ApiClient';

/**
 * Delete a link by ID
 * 
 * @param linkId - Link ID to delete
 */
export async function deleteLink(linkId: string): Promise<void> {
  return apiClient.delete<void>(`/links/${linkId}`);
}