import { apiClient } from '@/services/ApiClient';

/**
 * Subscribe to a plugin (pin it)
 * @param userId - Current user ID
 * @param pluginId - Plugin ID to subscribe to
 */
export async function subscribeToPlugin(userId: string, pluginId: string): Promise<void> {
  try {
    await apiClient.post(`/users/${userId}/plugins/${pluginId}`);
  } catch (error: any) {
    console.error('[PluginSubscription] Subscribe error:', error);
    throw new Error(error.response?.data?.message || 'Failed to subscribe to plugin');
  }
}

/**
 * Unsubscribe from a plugin (unpin it)
 * @param userId - Current user ID
 * @param pluginId - Plugin ID to unsubscribe from
 */
export async function unsubscribeFromPlugin(userId: string, pluginId: string): Promise<void> {
  try {
    await apiClient.delete(`/users/${userId}/plugins/${pluginId}`);
  } catch (error: any) {
    console.error('[PluginSubscription] Unsubscribe error:', error);
    throw new Error(error.response?.data?.message || 'Failed to unsubscribe from plugin');
  }
}