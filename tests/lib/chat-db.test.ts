import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

/**
 * Chat Database Tests
 * 
 * Streamlined tests for the chat database module using fake-indexeddb
 * to provide realistic IndexedDB behavior and maintain high test coverage.
 * 
 * Module Location: src/lib/chat-db.ts
 * Dependencies: Dexie (IndexedDB wrapper), fake-indexeddb
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock crypto.randomUUID for consistent test IDs
let uuidCounter = 0;
const mockUUID = vi.fn(() => `test-uuid-${++uuidCounter}`);
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockUUID
  }
});

// Mock navigator.storage for storage quota tests
const mockStorage = {
  persisted: vi.fn(),
  persist: vi.fn(),
  estimate: vi.fn()
};

Object.defineProperty(global, 'navigator', {
  value: {
    storage: mockStorage
  },
  writable: true
});

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import {
  ChatDB,
  db,
  chatDB,
  estimateBytes,
  ensurePersistentStorage,
  getBudgetBytes,
  appendMessage,
  enforceLimits,
  getAllConversations,
  getConversation,
  getMessages,
  updateConversationTitle,
  deleteConversation,
  clearAllData,
  getStorageInfo,
  exportData,
  importData,
  LIMITS,
  type Conversation,
  type Message,
  type Role,
  type KV
} from '../../src/lib/chat-db';

// ============================================================================
// TEST DATA
// ============================================================================

const createTestConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: `conv-${Date.now()}`,
  title: 'Test Conversation',
  deploymentId: 'test-deployment',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  approxBytes: 1024,
  ...overrides
});

const createTestMessage = (overrides: Partial<Message> = {}): Message => ({
  id: `msg-${Date.now()}`,
  conversationId: 'test-conv-id',
  role: 'user',
  content: 'Test message content',
  createdAt: Date.now(),
  sequence: Date.now(),
  approxBytes: 100,
  meta: {},
  ...overrides
});

// ============================================================================
// TESTS
// ============================================================================

describe('Chat Database Module', () => {
  beforeAll(() => {
    // Setup default storage mocks
    mockStorage.persisted.mockResolvedValue(true);
    mockStorage.persist.mockResolvedValue(true);
    mockStorage.estimate.mockResolvedValue({
      usage: 1024 * 1024, // 1MB
      quota: 10 * 1024 * 1024 // 10MB
    });
  });

  beforeEach(async () => {
    // Reset UUID counter
    uuidCounter = 0;
    vi.clearAllMocks();
    
    // Reset storage mocks to default values
    mockStorage.persisted.mockResolvedValue(true);
    mockStorage.persist.mockResolvedValue(true);
    mockStorage.estimate.mockResolvedValue({
      usage: 1024 * 1024, // 1MB
      quota: 10 * 1024 * 1024 // 10MB
    });
    
    // Clear the database before each test
    await clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllData();
  });

  // ==========================================================================
  // DATABASE CLASS AND EXPORTS TESTS
  // ==========================================================================

  describe('Database Class and Exports', () => {
    it('should create ChatDB instance and export database', () => {
      const chatDBInstance = new ChatDB();
      expect(chatDBInstance).toBeDefined();
      expect(chatDBInstance.conversations).toBeDefined();
      expect(chatDBInstance.messages).toBeDefined();
      expect(chatDBInstance.kv).toBeDefined();
      
      expect(db).toBeDefined();
      expect(db).toBeInstanceOf(ChatDB);
    });

    it('should export expected constants and limits', () => {
      expect(LIMITS).toEqual({
        MAX_CONVERSATIONS: 200,
        MAX_MESSAGES_PER_CONVO: 300,
        SOFT_BYTES_RATIO: 0.4,
        HARD_BYTES_RATIO: 0.6
      });
      
      expect(LIMITS.MAX_CONVERSATIONS).toBeGreaterThan(0);
      expect(LIMITS.SOFT_BYTES_RATIO).toBeLessThan(LIMITS.HARD_BYTES_RATIO);
    });

    it('should expose all expected chatDB methods', () => {
      const expectedMethods = [
        'createConversation', 'getAllConversations', 'getConversation', 'getMessages',
        'updateConversationTitle', 'deleteConversation', 'addMessage', 'updateMessage',
        'clearAllData', 'getStorageInfo', 'exportData', 'importData',
        'ensurePersistentStorage', 'getBudgetBytes', 'enforceLimits'
      ];
      
      expectedMethods.forEach(method => {
        expect(typeof chatDB[method]).toBe('function');
      });
    });
  });

  // ==========================================================================
  // UTILITY FUNCTIONS TESTS
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('estimateBytes', () => {
      it('should estimate bytes correctly for various message types', () => {
        // Empty content
        expect(estimateBytes({ content: '', meta: undefined })).toBe(0);
        expect(estimateBytes({ content: null as any, meta: undefined })).toBe(0);
        
        // Content only
        const simpleBytes = estimateBytes({ content: 'Hello world', meta: undefined });
        expect(simpleBytes).toBeGreaterThan(20);
        expect(simpleBytes).toBeLessThan(30);
        
        // Content with meta
        const complexBytes = estimateBytes({ 
          content: 'Hello world', 
          meta: { tokens: 5, attachments: [{ type: 'image', url: 'test.jpg' }] }
        });
        expect(complexBytes).toBeGreaterThan(simpleBytes);
      });
    });

    describe('ensurePersistentStorage', () => {
      it('should handle storage persistence scenarios', async () => {
        // Test when not persisted yet
        mockStorage.persisted.mockResolvedValue(false);
        await ensurePersistentStorage();
        expect(mockStorage.persist).toHaveBeenCalled();
        
        // Test when already persisted
        mockStorage.persisted.mockResolvedValue(true);
        await ensurePersistentStorage();
        expect(mockStorage.persisted).toHaveBeenCalled();
        
        // Test when storage API is missing
        const originalNavigator = global.navigator;
        (global as any).navigator = {};
        await expect(ensurePersistentStorage()).resolves.not.toThrow();
        global.navigator = originalNavigator;
      });
    });

    describe('getBudgetBytes', () => {
      it('should handle storage estimation scenarios', async () => {
        // Normal case
        const result = await getBudgetBytes();
        expect(result).toEqual({
          used: 1024 * 1024,
          quota: 10 * 1024 * 1024
        });
        
        // Missing storage API
        const originalNavigator = global.navigator;
        (global as any).navigator = {};
        const defaultResult = await getBudgetBytes();
        expect(defaultResult).toEqual({
          used: 0,
          quota: 50 * 1024 * 1024
        });
        global.navigator = originalNavigator;
        
        // Storage API error
        mockStorage.estimate.mockRejectedValue(new Error('Storage error'));
        await expect(getBudgetBytes()).rejects.toThrow('Storage error');
      });
    });
  });

  // ==========================================================================
  // CORE DATABASE OPERATIONS TESTS
  // ==========================================================================

  describe('Core Database Operations', () => {
    it('should handle conversation CRUD operations', async () => {
      // Test empty state
      expect(await getAllConversations()).toEqual([]);
      expect(await getConversation('non-existent')).toBeUndefined();
      
      // Create conversations
      const conv1 = createTestConversation({ id: 'conv-1', title: 'First', updatedAt: 1000 });
      const conv2 = createTestConversation({ id: 'conv-2', title: 'Second', updatedAt: 2000 });
      await db.conversations.add(conv1);
      await db.conversations.add(conv2);
      
      // Test retrieval and ordering
      const conversations = await getAllConversations();
      expect(conversations).toHaveLength(2);
      expect(conversations[0].id).toBe('conv-2'); // Most recent first
      
      const singleConv = await getConversation('conv-1');
      expect(singleConv).toEqual(conv1);
      
      // Test update
      await updateConversationTitle('conv-1', 'Updated Title');
      const updated = await db.conversations.get('conv-1');
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.updatedAt).toBeGreaterThan(1000);
    });

    it('should handle message CRUD operations', async () => {
      // Test empty state
      expect(await getMessages('empty-conv')).toEqual([]);
      
      // Create messages
      const msg1 = createTestMessage({ id: 'msg-1', conversationId: 'conv-1', createdAt: 1000 });
      const msg2 = createTestMessage({ id: 'msg-2', conversationId: 'conv-1', createdAt: 2000 });
      const msg3 = createTestMessage({ id: 'msg-3', conversationId: 'conv-2', createdAt: 1500 });
      
      await db.messages.add(msg1);
      await db.messages.add(msg2);
      await db.messages.add(msg3);
      
      // Test retrieval and sorting
      const messages = await getMessages('conv-1');
      expect(messages).toHaveLength(2);
      expect(messages[0].id).toBe('msg-1'); // Earliest first
      expect(messages[1].id).toBe('msg-2');
    });

    it('should handle conversation and message deletion', async () => {
      const testConv = createTestConversation({ id: 'test-conv' });
      const testMsg = createTestMessage({ conversationId: 'test-conv' });
      
      await db.conversations.add(testConv);
      await db.messages.add(testMsg);
      
      await deleteConversation('test-conv');
      
      expect(await db.conversations.get('test-conv')).toBeUndefined();
      const messages = await db.messages.where('conversationId').equals('test-conv').toArray();
      expect(messages).toHaveLength(0);
    });

    it('should clear all data', async () => {
      const testConv = createTestConversation();
      const testMsg = createTestMessage();
      const testKV = { key: 'test', value: 'data' };
      
      await db.conversations.add(testConv);
      await db.messages.add(testMsg);
      await db.kv.add(testKV);
      
      await clearAllData();
      
      expect(await db.conversations.count()).toBe(0);
      expect(await db.messages.count()).toBe(0);
      expect(await db.kv.count()).toBe(0);
    });
  });

  // ==========================================================================
  // CHATDB CONVENIENCE OBJECT TESTS
  // ==========================================================================

  describe('chatDB Convenience Object', () => {
    it('should handle conversation lifecycle', async () => {
      // Create conversation
      const conversationId = await chatDB.createConversation('Test Chat', 'deployment-1');
      expect(conversationId).toBe('test-uuid-1');
      
      const conversation = await db.conversations.get(conversationId);
      expect(conversation).toEqual({
        id: conversationId,
        title: 'Test Chat',
        deploymentId: 'deployment-1',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
    });

    it('should handle message operations', async () => {
      const convId = await chatDB.createConversation('Test Chat', 'deployment-1');
      const originalConv = await db.conversations.get(convId);
      
      // Add message with meta
      await new Promise(resolve => setTimeout(resolve, 1));
      const messageId = await chatDB.addMessage(convId, 'user', 'Hello world', { tokens: 5 });
      expect(messageId).toBe('test-uuid-2');
      
      const message = await db.messages.get(messageId);
      expect(message).toEqual({
        id: messageId,
        conversationId: convId,
        role: 'user',
        content: 'Hello world',
        meta: { tokens: 5 },
        createdAt: expect.any(Number),
        sequence: expect.any(Number)
      });
      
      // Add message without meta
      const messageId2 = await chatDB.addMessage(convId, 'assistant', 'Hello back');
      const message2 = await db.messages.get(messageId2);
      expect(message2?.meta).toEqual({});
      
      // Update message
      await new Promise(resolve => setTimeout(resolve, 1));
      await chatDB.updateMessage(messageId, { content: 'Updated content' });
      const updatedMessage = await db.messages.get(messageId);
      expect(updatedMessage?.content).toBe('Updated content');
      
      // Check conversation was updated
      const conversation = await db.conversations.get(convId);
      expect(conversation?.updatedAt).toBeGreaterThan(originalConv?.createdAt || 0);
      
      // Test non-existent message update
      await expect(chatDB.updateMessage('non-existent', { content: 'Updated' }))
        .resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // APPEND MESSAGE AND ENFORCE LIMITS TESTS
  // ==========================================================================

  describe('appendMessage and enforceLimits', () => {
    it('should handle appendMessage scenarios', async () => {
      // Append to existing conversation
      const conv = createTestConversation({ id: 'test-conv', approxBytes: 500 });
      await db.conversations.add(conv);
      
      const message = createTestMessage({ 
        id: 'unique-msg-1',
        conversationId: 'test-conv',
        content: 'Test message'
      });
      
      await appendMessage(message, 'Test Title');
      
      const savedMessage = await db.messages.get(message.id);
      expect(savedMessage?.approxBytes).toBeGreaterThan(0);
      
      const updatedConv = await db.conversations.get('test-conv');
      expect(updatedConv?.approxBytes).toBeGreaterThan(500);
      
      // Create new conversation
      const newMessage = createTestMessage({ 
        id: 'unique-msg-2',
        conversationId: 'new-conv',
        content: 'Test message'
      });
      
      await appendMessage(newMessage, 'New Conversation');
      const newConversation = await db.conversations.get('new-conv');
      expect(newConversation?.title).toBe('New Conversation');
      
      // Test default title
      const defaultMessage = createTestMessage({ 
        id: 'unique-msg-3',
        conversationId: 'default-conv',
        content: 'Test message'
      });
      
      await appendMessage(defaultMessage);
      const defaultConversation = await db.conversations.get('default-conv');
      expect(defaultConversation?.title).toBe('New chat');
    });

    it('should enforce limits', async () => {
      // Test conversation count limit
      const conversations = Array.from({ length: LIMITS.MAX_CONVERSATIONS + 5 }, (_, i) => 
        createTestConversation({ 
          id: `conv-${i}`, 
          updatedAt: i
        })
      );
      
      for (const conv of conversations) {
        await db.conversations.add(conv);
      }
      
      await enforceLimits();
      
      const remainingConversations = await db.conversations.count();
      expect(remainingConversations).toBeLessThanOrEqual(LIMITS.MAX_CONVERSATIONS);
      
      // Test empty database
      await clearAllData();
      await expect(enforceLimits()).resolves.not.toThrow();
      
      // Test conversation with no approxBytes
      const conv = createTestConversation({ 
        id: 'test-conv',
        approxBytes: undefined
      });
      await db.conversations.add(conv);
      await expect(enforceLimits()).resolves.not.toThrow();
    });

    it('should handle byte budget limits gracefully', async () => {
      // Mock storage under limits
      mockStorage.estimate.mockResolvedValue({
        usage: 2 * 1024 * 1024, // 2MB (under limits)
        quota: 10 * 1024 * 1024 // 10MB
      });
      
      const conversations = Array.from({ length: 3 }, (_, i) => 
        createTestConversation({ 
          id: `conv-${i}`,
          updatedAt: i,
          approxBytes: 512 * 1024
        })
      );
      
      for (const conv of conversations) {
        await db.conversations.add(conv);
      }
      
      await expect(enforceLimits()).resolves.not.toThrow();
      expect(await db.conversations.count()).toBe(3);
    });
  });

  // ==========================================================================
  // STORAGE INFO TESTS
  // ==========================================================================

  describe('Storage Management', () => {
    it('should return comprehensive storage information', async () => {
      const conv = createTestConversation();
      const msg = createTestMessage({ conversationId: conv.id });
      
      await db.conversations.add(conv);
      await db.messages.add(msg);
      
      const result = await getStorageInfo();
      
      expect(result).toEqual({
        used: 1024 * 1024,
        quota: 10 * 1024 * 1024,
        usedMB: '1.00',
        quotaMB: '10.00',
        percentUsed: '10.0',
        conversationCount: 1,
        messageCount: 1
      });
      
      // Test zero quota
      mockStorage.estimate.mockResolvedValue({ usage: 1024, quota: 0 });
      const zeroQuotaResult = await getStorageInfo();
      expect(zeroQuotaResult.percentUsed).toBe('Infinity');
    });
  });

  // ==========================================================================
  // EXPORT/IMPORT TESTS
  // ==========================================================================

  describe('Export/Import', () => {
    it('should export and import data correctly', async () => {
      // Test export with data
      const conv = createTestConversation({ id: 'test-conv' });
      const msg = createTestMessage({ conversationId: 'test-conv' });
      const kv = { key: 'test-key', value: 'test-value' };
      
      await db.conversations.add(conv);
      await db.messages.add(msg);
      await db.kv.add(kv);
      
      const exportResult = await exportData();
      
      expect(exportResult).toEqual({
        version: 1,
        exportDate: expect.any(String),
        conversations: [conv],
        messages: [msg],
        kv: [kv]
      });
      
      expect(exportResult.exportDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Test export with empty database
      await clearAllData();
      const emptyExport = await exportData();
      expect(emptyExport.conversations).toEqual([]);
      expect(emptyExport.messages).toEqual([]);
      expect(emptyExport.kv).toEqual([]);
      
      // Test import
      const existingConv = createTestConversation({ id: 'existing' });
      await db.conversations.add(existingConv);
      
      const importConv = createTestConversation({ id: 'imported' });
      const importMsg = createTestMessage({ conversationId: 'imported' });
      const importKV = { key: 'imported-key', value: 'imported-value' };
      
      await chatDB.importData({
        version: 1,
        conversations: [importConv],
        messages: [importMsg],
        kv: [importKV]
      });
      
      // Check old data is gone and new data is present
      const conversations = await db.conversations.toArray();
      const messages = await db.messages.toArray();
      const kvData = await db.kv.toArray();
      
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('imported');
      expect(messages).toHaveLength(1);
      expect(kvData).toHaveLength(1);
      
      // Test unsupported version
      await expect(chatDB.importData({ version: 2, conversations: [] }))
        .rejects.toThrow('Unsupported export version');
      
      // Test partial import
      await chatDB.importData({
        version: 1,
        conversations: [createTestConversation({ id: 'partial' })]
      });
      
      expect(await db.conversations.count()).toBe(1);
      expect(await db.messages.count()).toBe(0);
      expect(await db.kv.count()).toBe(0);
    });
  });


  // ==========================================================================
  // INTEGRATION AND ERROR HANDLING TESTS
  // ==========================================================================

  describe('Integration and Error Handling', () => {
    it('should handle complete chat workflow', async () => {
      // Create conversation and messages
      const conversationId = await chatDB.createConversation('Integration Test', 'test-deployment');
      const userMsgId = await chatDB.addMessage(conversationId, 'user', 'Hello AI');
      const assistantMsgId = await chatDB.addMessage(conversationId, 'assistant', 'Hello human!');
      
      // Verify workflow
      const messages = await chatDB.getMessages(conversationId);
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      
      // Update and verify
      await chatDB.updateConversationTitle(conversationId, 'Updated Title');
      const conversation = await chatDB.getConversation(conversationId);
      expect(conversation?.title).toBe('Updated Title');
      
      // Check storage info
      const storageInfo = await chatDB.getStorageInfo();
      expect(storageInfo.conversationCount).toBe(1);
      expect(storageInfo.messageCount).toBe(2);
      
      // Export and clear
      const exportedData = await chatDB.exportData();
      expect(exportedData.conversations).toHaveLength(1);
      expect(exportedData.messages).toHaveLength(2);
      
      await chatDB.clearAllData();
      const finalStorageInfo = await chatDB.getStorageInfo();
      expect(finalStorageInfo.conversationCount).toBe(0);
      expect(finalStorageInfo.messageCount).toBe(0);
    });

    it('should handle error scenarios', async () => {
      // Storage quota exceeded
      mockStorage.estimate.mockResolvedValue({
        usage: 100 * 1024 * 1024,
        quota: 50 * 1024 * 1024
      });
      const result = await getBudgetBytes();
      expect(result.used).toBeGreaterThan(result.quota);
      
      // Missing navigator
      const originalNavigator = global.navigator;
      (global as any).navigator = null;
      await expect(getBudgetBytes()).rejects.toThrow();
      global.navigator = originalNavigator;
      
      // Database transaction errors
      const invalidMessage = createTestMessage({ 
        id: null as any,
        conversationId: 'test-conv'
      });
      await expect(db.messages.add(invalidMessage)).rejects.toThrow();
    });

    it('should handle edge cases in appendMessage', async () => {
      const conv = createTestConversation({ id: 'test-conv' });
      await db.conversations.add(conv);
      
      // Test different message roles and meta structures
      const testCases = [
        { role: 'assistant' as Role, content: 'Assistant message', meta: {}, expectedMeta: {} },
        { role: 'user' as Role, content: 'User message', meta: { tokens: 10, type: 'user' }, expectedMeta: { tokens: 10, type: 'user' } },
        { role: 'system' as Role, content: 'System message', meta: {}, expectedMeta: {} }
      ];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const message = createTestMessage({ 
          id: `edge-msg-${i}`,
          conversationId: 'test-conv',
          role: testCase.role,
          content: testCase.content,
          meta: testCase.meta
        });
        
        await appendMessage(message);
        
        const savedMessage = await db.messages.get(message.id);
        expect(savedMessage?.role).toBe(testCase.role);
        expect(savedMessage?.meta).toEqual(testCase.expectedMeta);
      }
    });

    it('should handle performance scenarios', () => {
      // Test byte estimation performance
      const largeContent = 'x'.repeat(10000);
      const message = { content: largeContent, meta: undefined };
      
      const start = performance.now();
      const bytes = estimateBytes(message);
      const end = performance.now();
      
      expect(bytes).toBeGreaterThan(20000);
      expect(end - start).toBeLessThan(10);
      
      // Test complex meta performance
      const complexMeta = {
        attachments: Array(100).fill({ type: 'file', url: 'test.jpg' }),
        toolCalls: Array(50).fill({ name: 'tool', args: { param: 'value' } })
      };
      
      const complexMessage = { content: 'Test', meta: complexMeta };
      const complexBytes = estimateBytes(complexMessage);
      expect(complexBytes).toBeGreaterThan(1000);
    });
  });
});
