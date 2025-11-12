import { useState, useEffect, useCallback } from 'react';
import { chatDB, ChatConversation, ChatMessage } from '@/lib/chat-db';

export interface UseChatHistoryReturn {
  conversations: ChatConversation[];
  loading: boolean;
  error: string | null;

  // Conversation operations
  createConversation: (title: string, deploymentId: string) => Promise<string>;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  getConversation: (conversationId: string) => Promise<ChatConversation | undefined>;

  // Message operations
  getMessages: (conversationId: string) => Promise<ChatMessage[]>;
  addMessage: (conversationId: string, role: 'user' | 'assistant' | 'system', content: string) => Promise<void>;

  // Storage management
  getStorageInfo: () => Promise<{ used: number; quota: number; percentage: number } | null>;
  exportData: () => Promise<Blob>;
  importData: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

/**
 * React hook for managing chat history with IndexedDB
 * Provides CRUD operations for conversations and messages with automatic capacity management
 */
export function useChatHistory(): UseChatHistoryReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const convos = await chatDB.getAllConversations();
      setConversations(convos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (title: string, deploymentId: string): Promise<string> => {
    try {
      const conversationId = await chatDB.createConversation(title, deploymentId);
      await loadConversations(); // Refresh list
      return conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      throw err;
    }
  }, [loadConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await chatDB.deleteConversation(conversationId);
      await loadConversations(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      throw err;
    }
  }, [loadConversations]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, title: string): Promise<void> => {
    try {
      await chatDB.updateConversationTitle(conversationId, title);
      await loadConversations(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation';
      setError(errorMessage);
      throw err;
    }
  }, [loadConversations]);

  // Get a single conversation
  const getConversation = useCallback(async (conversationId: string): Promise<ChatConversation | undefined> => {
    try {
      return await chatDB.getConversation(conversationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get conversation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get messages for a conversation
  const getMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      return await chatDB.getMessages(conversationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get messages';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Add a message to a conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<void> => {
    try {
      await chatDB.addMessage(conversationId, role, content);
      // Note: We don't refresh conversations list here for performance
      // The UI should handle updating the active conversation's messages
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get storage information
  const getStorageInfo = useCallback(async () => {
    try {
      return await chatDB.getStorageInfo();
    } catch (err) {
      console.error('Failed to get storage info:', err);
      return null;
    }
  }, []);

  // Export all data as JSON
  const exportData = useCallback(async (): Promise<Blob> => {
    try {
      return await chatDB.exportData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Import data from JSON file
  const importData = useCallback(async (file: File): Promise<void> => {
    try {
      await chatDB.importData(file);
      await loadConversations(); // Refresh list after import
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      throw err;
    }
  }, [loadConversations]);

  // Clear all data
  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      await chatDB.clearAllData();
      await loadConversations(); // Refresh list (will be empty)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      throw err;
    }
  }, [loadConversations]);

  // Refresh conversations list
  const refresh = useCallback(async (): Promise<void> => {
    await loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    getConversation,
    getMessages,
    addMessage,
    getStorageInfo,
    exportData,
    importData,
    clearAllData,
    refresh,
  };
}
