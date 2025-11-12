import Dexie, { Table } from 'dexie';

export type Role = 'user' | 'assistant' | 'system' | 'summary';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  approxBytes?: number;   // rolling sum of message sizes for faster pruning
  deploymentId?: string;  // optional deployment identifier
}

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  tokens?: number;
  createdAt: number;
  sequence?: number;     // message sequence number
  meta?: Record<string, unknown>;  // attachments, tool calls, etc.
  approxBytes?: number;  // cached size of this record
}

// Type aliases for external use
export type ChatConversation = Conversation;
export type ChatMessage = Message;

export interface KV {
  key: string;
  value: unknown;
}

export class ChatDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  kv!: Table<KV, string>;

  constructor() {
    super('chatdb');
    this.version(1).stores({
      conversations: 'id, updatedAt, createdAt',
      messages: 'id, conversationId, createdAt',
      kv: 'key',
    });
  }
}

export const db = new ChatDB();

// Configuration knobs
export const LIMITS = {
  MAX_CONVERSATIONS: 200,              // keep most recent by updatedAt
  MAX_MESSAGES_PER_CONVO: 300,         // trim oldest beyond this
  SOFT_BYTES_RATIO: 0.4,               // 40% of available quota
  HARD_BYTES_RATIO: 0.6,               // 60% absolute ceiling
};

// Size estimator: rough but fast
export function estimateBytes(m: Pick<Message, 'content' | 'meta'>): number {
  const contentLen = m.content ? m.content.length : 0;
  const metaLen = m.meta ? JSON.stringify(m.meta).length : 0;
  // UTF-16 in JS strings ~= 2 bytes/char, add overhead
  return Math.floor((contentLen + metaLen) * 2 * 1.15);
}

export async function ensurePersistentStorage() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    const persisted = await navigator.storage.persisted?.();
    if (!persisted) await navigator.storage.persist?.();
  }
}

export async function getBudgetBytes() {
  if (!('storage' in navigator) || !navigator.storage.estimate) {
    return { used: 0, quota: 50 * 1024 * 1024 }; // 50MB guess
  }
  const { usage = 0, quota = 50 * 1024 * 1024 } = await navigator.storage.estimate();
  return { used: usage, quota };
}

// Core write with capacity management
export async function appendMessage(msg: Message, convTitleIfNew?: string) {
  const bytes = estimateBytes(msg);
  msg.approxBytes = bytes;

  await db.transaction('readwrite', db.messages, db.conversations, async () => {
    // Upsert conversation
    let conv = await db.conversations.get(msg.conversationId);
    if (!conv) {
      conv = {
        id: msg.conversationId,
        title: convTitleIfNew ?? 'New chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        approxBytes: 0,
      };
      await db.conversations.add(conv);
    }

    // Insert message
    await db.messages.add(msg);
    // Update conversation rolling size + updatedAt
    await db.conversations.update(conv.id, {
      updatedAt: Date.now(),
      approxBytes: (conv.approxBytes || 0) + bytes,
    });
  });

  // Enforce limits AFTER write
  await enforceLimits();
}

// Eviction driver
export async function enforceLimits() {
  // 1) Enforce conversation count
  const convoCount = await db.conversations.count();
  if (convoCount > LIMITS.MAX_CONVERSATIONS) {
    const toDelete = await db.conversations
      .orderBy('updatedAt')
      .limit(convoCount - LIMITS.MAX_CONVERSATIONS)
      .toArray();
    await deleteConversations(toDelete.map(c => c.id));
  }

  // 2) Enforce per-conversation message caps
  const candidates = await db.conversations.orderBy('updatedAt').toArray();
  for (const c of candidates) {
    const count = await db.messages.where('conversationId').equals(c.id).count();
    if (count > LIMITS.MAX_MESSAGES_PER_CONVO) {
      const excess = count - LIMITS.MAX_MESSAGES_PER_CONVO;
      await trimOldestMessages(c.id, excess, true);
    }
  }

  // 3) Enforce byte budget
  const { used, quota } = await getBudgetBytes();
  const softCap = quota * LIMITS.SOFT_BYTES_RATIO;
  const hardCap = quota * LIMITS.HARD_BYTES_RATIO;

  if (used > softCap) {
    await pruneByBytes(used - softCap);
  }
  
  const again = await getBudgetBytes();
  if (again.used > hardCap) {
    await pruneByBytes(again.used - hardCap);
  }
}

async function trimOldestMessages(conversationId: string, amount: number, summarize: boolean) {
  const toTrim = await db.messages
    .where('conversationId').equals(conversationId)
    .orderBy('createdAt')
    .limit(amount)
    .toArray();

  if (!toTrim.length) return;

  let freed = 0;
  for (const m of toTrim) freed += m.approxBytes || estimateBytes(m);

  await db.transaction('readwrite', db.messages, db.conversations, async () => {
    await db.messages.bulkDelete(toTrim.map(m => m.id));

    // Optional: write a summary sentinel
    if (summarize) {
      const summary: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'summary',
        content: `⟲ Older ${toTrim.length} messages were compacted.`,
        createdAt: Date.now(),
        approxBytes: estimateBytes({ content: `⟲ Older ${toTrim.length} messages were compacted.`, meta: null }),
      };
      await db.messages.add(summary);
    }

    const conv = await db.conversations.get(conversationId);
    if (conv) {
      await db.conversations.update(conversationId, {
        approxBytes: Math.max(0, (conv.approxBytes || 0) - freed),
        updatedAt: Date.now(),
      });
    }
  });
}

async function deleteConversations(ids: string[]) {
  if (!ids.length) return;
  await db.transaction('readwrite', db.messages, db.conversations, async () => {
    for (const id of ids) {
      await db.messages.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    }
  });
}

async function pruneByBytes(bytesToFree: number) {
  if (bytesToFree <= 0) return;

  const ordered = await db.conversations.orderBy('updatedAt').toArray();
  let freed = 0;

  for (const c of ordered) {
    if (freed >= bytesToFree) break;

    if ((c.approxBytes || 0) < bytesToFree * 0.4) {
      await deleteConversations([c.id]);
      freed += c.approxBytes || 0;
    } else {
      const msgCount = await db.messages.where('conversationId').equals(c.id).count();
      const toTrim = Math.ceil(msgCount / 2);
      await trimOldestMessages(c.id, Math.max(1, toTrim), true);
      freed = bytesToFree;
    }
  }
}

// Helper functions for UI
export async function getAllConversations(): Promise<Conversation[]> {
  return db.conversations.orderBy('updatedAt').reverse().toArray();
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return db.conversations.get(id);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return db.messages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('createdAt');
}

export async function updateConversationTitle(id: string, title: string) {
  await db.conversations.update(id, { title, updatedAt: Date.now() });
}

export async function deleteConversation(id: string) {
  await deleteConversations([id]);
}

export async function clearAllData() {
  await db.transaction('readwrite', db.conversations, db.messages, db.kv, async () => {
    await db.conversations.clear();
    await db.messages.clear();
    await db.kv.clear();
  });
}

export async function getStorageInfo() {
  const { used, quota } = await getBudgetBytes();
  const convoCount = await db.conversations.count();
  const messageCount = await db.messages.count();
  
  return {
    used,
    quota,
    usedMB: (used / (1024 * 1024)).toFixed(2),
    quotaMB: (quota / (1024 * 1024)).toFixed(2),
    percentUsed: ((used / quota) * 100).toFixed(1),
    conversationCount: convoCount,
    messageCount: messageCount,
  };
}

// Export/Import helpers
export async function exportData() {
  const conversations = await db.conversations.toArray();
  const messages = await db.messages.toArray();
  const kv = await db.kv.toArray();
  
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    conversations,
    messages,
    kv,
  };
}

export async function importData(data: { version: number; conversations?: Conversation[]; messages?: Message[]; kv?: KV[] }) {
  if (data.version !== 1) {
    throw new Error('Unsupported export version');
  }

  await db.transaction('readwrite', db.conversations, db.messages, db.kv, async () => {
    // Clear existing data
    await db.conversations.clear();
    await db.messages.clear();
    await db.kv.clear();

    // Import new data
    if (data.conversations) await db.conversations.bulkAdd(data.conversations);
    if (data.messages) await db.messages.bulkAdd(data.messages);
    if (data.kv) await db.kv.bulkAdd(data.kv);
  });

  // Enforce limits after import
  await enforceLimits();
}

/**
 * Convenience object that wraps all chat DB operations
 * This is the recommended way to interact with the chat database
 */
export const chatDB = {
  // Core operations
  createConversation: async (title: string, deploymentId: string): Promise<string> => {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      deploymentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.conversations.add(conversation);
    return conversation.id;
  },

  getAllConversations,
  getConversation,
  getMessages,
  updateConversationTitle,
  deleteConversation,

  addMessage: async (conversationId: string, role: Role, content: string, meta?: Record<string, unknown>): Promise<string> => {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role,
      content,
      createdAt: Date.now(),
      sequence: Date.now(), // Use timestamp as sequence for simplicity
      meta: meta || {},
    };
    await db.messages.add(message);

    // Update conversation updatedAt
    await db.conversations.update(conversationId, { updatedAt: Date.now() });

    // Enforce limits after adding message
    await enforceLimits();

    return message.id;
  },

  updateMessage: async (messageId: string, updates: Partial<Pick<Message, 'content' | 'meta'>>): Promise<void> => {
    await db.messages.update(messageId, updates);

    // Update conversation updatedAt if message exists
    const message = await db.messages.get(messageId);
    if (message) {
      await db.conversations.update(message.conversationId, { updatedAt: Date.now() });
    }
  },

  // Storage management
  clearAllData,
  getStorageInfo,
  exportData,
  importData,

  // Advanced
  ensurePersistentStorage,
  getBudgetBytes,
  enforceLimits,
};
