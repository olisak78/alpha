import { useCallback, useEffect, useMemo, useState } from "react";
import { Conversation, Message, ChatSettings } from "../types/chat";
import { useChatInference, type ChatMessage } from "@/services/aiPlatformApi";
import { chatDB } from "@/lib/chat-db";

const STORAGE_KEY = "ai_arena_conversations_v1";
const SETTINGS_KEY = "ai_arena_settings_v1";
const MIGRATION_KEY = "ai_arena_migrated_to_indexeddb";

// Safe UUID generator with fallback for older browsers
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp-based UUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

const defaultSettings: ChatSettings = {
  model: "GPT-4",
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt:
    `You are a helpful SAP assistant. Provide clear, concise answers and help with technical questions.

IMPORTANT FORMATTING RULES:
- When providing code examples, you MUST use markdown code fence blocks with the CORRECT language identifier
- Correct format: \`\`\`python (on its own line, followed by code, then \`\`\` on its own line to close)
- Example:
  \`\`\`python
  print("Hello, World!")
  \`\`\`
- Supported languages and their identifiers:
  * Python: \`\`\`python
  * Java: \`\`\`java
  * JavaScript: \`\`\`javascript or \`\`\`js
  * TypeScript: \`\`\`typescript or \`\`\`ts
  * Go/Golang: \`\`\`go (NOT java!)
  * PHP: \`\`\`php
  * SQL: \`\`\`sql
  * JSON: \`\`\`json
  * YAML: \`\`\`yaml
  * Bash/Shell: \`\`\`bash or \`\`\`sh
  * C: \`\`\`c
  * C++: \`\`\`cpp
  * C#: \`\`\`csharp
  * Rust: \`\`\`rust
  * Ruby: \`\`\`ruby
- CRITICAL: Use the correct language identifier that matches the actual code language
- NEVER write code as plain text with line breaks - ALWAYS use proper code fences
- This is critical for proper syntax highlighting and readability`
};

// Legacy localStorage functions for migration
function loadLegacyConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSettings(): ChatSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);

    // Check if the system prompt needs updating (old version without language identifiers)
    const hasOldPrompt = parsed.systemPrompt &&
      !parsed.systemPrompt.includes('IMPORTANT FORMATTING RULES') &&
      !parsed.systemPrompt.includes('Go/Golang');

    // If old prompt detected, use the new default prompt but keep other settings
    if (hasOldPrompt) {
      return { ...defaultSettings, ...parsed, systemPrompt: defaultSettings.systemPrompt };
    }

    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(s: ChatSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// Migration from localStorage to IndexedDB
async function migrateToIndexedDB(): Promise<void> {
  const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
  if (alreadyMigrated) return;

  const legacyConversations = loadLegacyConversations();
  if (legacyConversations.length === 0) {
    localStorage.setItem(MIGRATION_KEY, "true");
    return;
  }

  try {
    for (const conv of legacyConversations) {
      // Create conversation in IndexedDB
      const deploymentId = "unknown"; // Legacy conversations don't have deploymentId
      const conversationId = await chatDB.createConversation(conv.title, deploymentId);

      // Add all messages
      for (const msg of conv.messages) {
        await chatDB.addMessage(conversationId, msg.role, msg.content);
      }
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, "true");
    // Keep legacy data for safety, user can clear manually if needed
  } catch (error) {
    console.error("[useChat] Failed to migrate to IndexedDB:", error);
    // Don't mark as migrated if failed, will retry next time
  }
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(loadSettings);
  const [isLoading, setIsLoading] = useState(true);
  const chatInference = useChatInference();

  const active = useMemo(
    () => conversations.find(c => c.id === activeId) ?? null,
    [conversations, activeId]
  );
  const messages = active?.messages ?? [];

  // Load conversations from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Run migration first
        await migrateToIndexedDB();

        // Load conversations from IndexedDB
        const dbConversations = await chatDB.getAllConversations();

        // Convert from IndexedDB format to UI format
        const uiConversations: Conversation[] = await Promise.all(
          dbConversations.map(async (conv) => {
            const messages = await chatDB.getMessages(conv.id);
            return {
              id: conv.id,
              title: conv.title,
              messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
                // Load alternatives and currentAlternativeIndex from meta
                alternatives: msg.meta?.alternatives as string[] | undefined,
                currentAlternativeIndex: msg.meta?.currentAlternativeIndex as number | undefined,
              })),
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt,
            };
          })
        );

        setConversations(uiConversations);
        if (uiConversations.length > 0 && !activeId) {
          setActiveId(uiConversations[0].id);
        }
      } catch (error) {
        console.error("[useChat] Failed to load conversations from IndexedDB:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Only run on mount

  // Save settings to localStorage (keep this simple for settings)
  useEffect(() => { saveSettings(settings); }, [settings]);

  const createConversation = useCallback(async (title = "New Chat") => {
    try {
      const deploymentId = settings.deploymentId || "unknown";
      const conversationId = await chatDB.createConversation(title, deploymentId);

      const conv: Conversation = {
        id: conversationId,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setConversations(prev => [conv, ...prev]);
      setActiveId(conversationId);
    } catch (error) {
      console.error("[useChat] Failed to create conversation:", error);
    }
  }, [settings.deploymentId]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await chatDB.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      setActiveId(prev => (prev === id ? null : prev));
    } catch (error) {
      console.error("[useChat] Failed to delete conversation:", error);
    }
  }, []);

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await chatDB.updateConversationTitle(id, title);
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c));
    } catch (error) {
      console.error("[useChat] Failed to rename conversation:", error);
    }
  }, []);

  const send = useCallback(async (content: string, attachments?: Array<{url: string; mimeType: string; filename: string; size: number}>) => {
    if (!settings.deploymentId) {
      console.error("No deployment selected");
      return;
    }

    let convId = active?.id;

    // If no conversation, create one first
    if (!active) {
      const deploymentId = settings.deploymentId || "unknown";
      const newConvId = await chatDB.createConversation(content.slice(0, 32) || "New Chat", deploymentId);
      convId = newConvId;

      const conv: Conversation = {
        id: newConvId,
        title: content.slice(0, 32) || "New Chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setConversations(prev => [conv, ...prev]);
      setActiveId(newConvId);
    }

    if (!convId) return;

    // Save user message to IndexedDB and get the ID
    const userMsgId = await chatDB.addMessage(convId, "user", content);
    const userMsg: Message = { id: userMsgId, role: "user", content, createdAt: Date.now() };

    // Create assistant message ID upfront for streaming
    const streamingMsgId = generateUUID();

    // Add a streaming placeholder message for the assistant
    const streamingMsg: Message = {
      id: streamingMsgId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true
    };

    // Determine if we need to update the title for new conversations
    const currentConv = conversations.find(c => c.id === convId);
    const shouldUpdateTitle = currentConv?.title === "New Chat";
    const newTitle = shouldUpdateTitle ? (content.slice(0, 32) || "New Chat") : currentConv?.title;

    // If title needs updating, persist it to IndexedDB
    if (shouldUpdateTitle && newTitle && newTitle !== "New Chat") {
      await chatDB.updateConversationTitle(convId, newTitle);
    }

    // Update UI with user message and streaming message
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, userMsg, streamingMsg], updatedAt: Date.now(), title: newTitle || c.title }
        : c
    ));

    try {
      // Get current conversation messages
      const currentConv = conversations.find(c => c.id === convId);
      const allMessages = currentConv ? [...currentConv.messages, userMsg] : [userMsg];

      // Convert messages to API format with multimodal support
      const apiMessages: ChatMessage[] = allMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // If this message has attachments, use multimodal format for the last user message
      if (attachments && attachments.length > 0) {
        const lastMessage = apiMessages[apiMessages.length - 1];
        if (lastMessage.role === 'user') {
          const contentParts: Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string}}> = [];

          // Add text content
          if (content) {
            contentParts.push({
              type: 'text',
              text: content
            });
          }

          // Process attachments
          attachments.forEach(file => {
            if (file.mimeType.startsWith('image/')) {
              // Images as data URLs
              contentParts.push({
                type: 'image_url',
                image_url: {
                  url: file.url
                }
              });
            } else if (file.mimeType.startsWith('text/') ||
                       file.mimeType === 'application/json' ||
                       file.mimeType === 'application/xml' ||
                       file.mimeType === 'application/x-yaml') {
              // Text files - decode base64 and include as text
              try {
                const base64Data = file.url.split(',')[1];
                const decodedText = atob(base64Data);
                contentParts.push({
                  type: 'text',
                  text: `\n\n[File: ${file.filename}]\n\`\`\`\n${decodedText}\n\`\`\``
                });
              } catch (e) {
                console.error('Failed to decode file:', e);
              }
            }
          });

          lastMessage.content = contentParts as ChatMessage['content'];
        }
      }

      // Add system prompt if configured
      if (settings.systemPrompt) {
        apiMessages.unshift({ role: 'system', content: settings.systemPrompt });
      }

      const response = await chatInference.mutateAsync({
        deploymentId: settings.deploymentId,
        messages: apiMessages,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        stream: true,
        // Real-time streaming callback - updates UI as chunks arrive
        onChunk: (content: string) => {
          setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;

            // Update the streaming message with new content
            const updatedMessages = c.messages.map(m =>
              m.id === streamingMsgId
                ? { ...m, content, isStreaming: true }
                : m
            );

            return {
              ...c,
              messages: updatedMessages,
              updatedAt: Date.now()
            };
          }));
        }
      });

      const assistantContent = response.choices[0]?.message?.content || "No response";
      const assistantContentStr = typeof assistantContent === 'string' ? assistantContent : JSON.stringify(assistantContent);

      // Save final assistant message to IndexedDB and get the DB-generated ID
      const assistantMsgId = await chatDB.addMessage(convId, "assistant", assistantContentStr);

      // Final update to ensure we have the complete message and clear streaming state
      // IMPORTANT: Update the message ID to match the IndexedDB ID so future updates work
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;

        const updatedMessages = c.messages.map(m =>
          m.id === streamingMsgId
            ? { ...m, id: assistantMsgId, content: assistantContentStr, isStreaming: false }
            : m
        );

        return {
          ...c,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorContent = "Sorry, I encountered an error processing your request. Please try again.";

      // Save error message to IndexedDB and get the DB-generated ID
      const errorMsgId = await chatDB.addMessage(convId, "assistant", errorContent);

      // Update streaming message with error content and DB ID
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;

        const updatedMessages = c.messages.map(m =>
          m.id === streamingMsgId
            ? { ...m, id: errorMsgId, content: errorContent, isStreaming: false }
            : m
        );

        return {
          ...c,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      }));
    }
  }, [active, conversations, settings, chatInference]);

  const regenerate = useCallback(async () => {
    if (!active || active.messages.length === 0 || !settings.deploymentId) return;

    // Find the last assistant message
    let lastAssistantIdx = -1;
    for (let i = active.messages.length - 1; i >= 0; i--) {
      if (active.messages[i].role === "assistant") {
        lastAssistantIdx = i;
        break;
      }
    }

    if (lastAssistantIdx === -1) return;

    const lastAssistantMsg = active.messages[lastAssistantIdx];
    const messagesUpToAssistant = active.messages.slice(0, lastAssistantIdx);

    // IMPORTANT: Capture the original content BEFORE streaming overwrites it
    const originalContent = lastAssistantMsg.content;

    // Set loading state
    setConversations(prev => prev.map(c => {
      if (c.id !== active.id) return c;
      const updatedMessages = [...c.messages];
      updatedMessages[lastAssistantIdx] = { ...updatedMessages[lastAssistantIdx], isRegenerating: true };
      return { ...c, messages: updatedMessages };
    }));

    try {
      // Convert messages to API format
      const apiMessages: ChatMessage[] = messagesUpToAssistant.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Add system prompt if configured
      if (settings.systemPrompt) {
        apiMessages.unshift({ role: 'system', content: settings.systemPrompt });
      }

      const response = await chatInference.mutateAsync({
        deploymentId: settings.deploymentId,
        messages: apiMessages,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        stream: true,
        // Real-time streaming callback for regeneration
        onChunk: (content: string) => {
          setConversations(prev => prev.map(c => {
            if (c.id !== active.id) return c;

            const updatedMessages = [...c.messages];
            updatedMessages[lastAssistantIdx] = {
              ...updatedMessages[lastAssistantIdx],
              content,
              isRegenerating: false,
              isStreaming: true
            };

            return { ...c, messages: updatedMessages };
          }));
        }
      });

      const newContent = response.choices[0]?.message?.content || "No response";
      const newContentStr = typeof newContent === 'string' ? newContent : JSON.stringify(newContent);

      // Update the message with the new alternative
      setConversations(prev => prev.map(c => {
        if (c.id !== active.id) return c;

        const updatedMessages = [...c.messages];
        const msg = updatedMessages[lastAssistantIdx];

        // Initialize alternatives array if it doesn't exist - use captured original content
        if (!msg.alternatives) {
          msg.alternatives = [originalContent];
          msg.currentAlternativeIndex = 0;
        }

        // Add new alternative
        msg.alternatives.push(newContentStr);
        msg.currentAlternativeIndex = msg.alternatives.length - 1;
        msg.content = newContentStr;
        msg.isRegenerating = false;
        msg.isStreaming = false;

        // Persist alternatives to IndexedDB
        chatDB.updateMessage(msg.id, {
          content: newContentStr,
          meta: {
            alternatives: msg.alternatives,
            currentAlternativeIndex: msg.currentAlternativeIndex
          }
        }).catch(err => console.error("Failed to persist alternatives to IndexedDB:", err));

        return { ...c, messages: updatedMessages, updatedAt: Date.now() };
      }));
    } catch (error) {
      console.error("Failed to regenerate:", error);
      // Clear loading state on error
      setConversations(prev => prev.map(c => {
        if (c.id !== active.id) return c;
        const updatedMessages = [...c.messages];
        updatedMessages[lastAssistantIdx] = { ...updatedMessages[lastAssistantIdx], isRegenerating: false };
        return { ...c, messages: updatedMessages };
      }));
    }
  }, [active, settings, chatInference]);

  const navigateAlternative = useCallback((messageId: string, direction: 'prev' | 'next') => {
    if (!active) return;

    setConversations(prev => prev.map(c => {
      if (c.id !== active.id) return c;

      const updatedMessages = c.messages.map(m => {
        if (m.id !== messageId || !m.alternatives || m.alternatives.length === 0) return m;

        const currentIdx = m.currentAlternativeIndex ?? 0;
        let newIdx = currentIdx;

        if (direction === 'prev' && currentIdx > 0) {
          newIdx = currentIdx - 1;
        } else if (direction === 'next' && currentIdx < m.alternatives.length) {
          newIdx = currentIdx + 1;
        }

        // Get content from alternatives or original
        const content = newIdx === 0 ? m.alternatives[0] : m.alternatives[newIdx];

        // Persist the current alternative index to IndexedDB
        chatDB.updateMessage(m.id, {
          content,
          meta: {
            alternatives: m.alternatives,
            currentAlternativeIndex: newIdx
          }
        }).catch(err => console.error("Failed to persist alternative index to IndexedDB:", err));

        return {
          ...m,
          currentAlternativeIndex: newIdx,
          content
        };
      });

      return { ...c, messages: updatedMessages };
    }));
  }, [active]);

  const setActive = useCallback((id: string) => setActiveId(id), []);
  const updateSettings = useCallback((s: Partial<ChatSettings>) => setSettings(prev => ({ ...prev, ...s })), []);
  const resetSettings = useCallback(() => setSettings(defaultSettings), []);

  return {
    conversations, active, activeId, messages,
    createConversation, deleteConversation, renameConversation,
    send, regenerate, setActive, navigateAlternative,
    settings, updateSettings, resetSettings
  };
}
