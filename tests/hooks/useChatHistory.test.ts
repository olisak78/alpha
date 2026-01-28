import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChatHistory } from '@/hooks/useChatHistory';
import * as chatDB from '@/lib/chat-db';

// Mock the chat-db module
vi.mock('@/lib/chat-db', () => ({
    chatDB: {
        getAllConversations: vi.fn(),
        createConversation: vi.fn(),
        deleteConversation: vi.fn(),
        updateConversationTitle: vi.fn(),
        getConversation: vi.fn(),
        getMessages: vi.fn(),
        addMessage: vi.fn(),
        getStorageInfo: vi.fn(),
        exportData: vi.fn(),
        importData: vi.fn(),
        clearAllData: vi.fn(),
    },
}));

describe('useChatHistory', () => {
    const mockConversations: chatDB.ChatConversation[] = [
        {
            id: 'conv-1',
            title: 'First Conversation',
            deploymentId: 'deploy-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            messageCount: 5,
        },
        {
            id: 'conv-2',
            title: 'Second Conversation',
            deploymentId: 'deploy-2',
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
            messageCount: 3,
        },
    ];

    const mockMessages: chatDB.ChatMessage[] = [
        {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date('2024-01-01T10:00:00'),
        },
        {
            id: 'msg-2',
            conversationId: 'conv-1',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: new Date('2024-01-01T10:00:05'),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset console.error mock
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('Initial Loading', () => {
        it('should start in loading state', () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            const { result } = renderHook(() => useChatHistory());

            expect(result.current.loading).toBe(true);
            expect(result.current.conversations).toEqual([]);
            expect(result.current.error).toBe(null);
        });

        it('should load conversations on mount', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);

            const { result } = renderHook(() => useChatHistory());

            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toEqual(mockConversations);
            expect(result.current.error).toBe(null);
            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(1);
        });

        it('should set error state when loading fails', async () => {
            const errorMessage = 'Database connection failed';
            vi.mocked(chatDB.chatDB.getAllConversations).mockRejectedValue(
                new Error(errorMessage)
            );

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toEqual([]);
            expect(result.current.error).toBe(errorMessage);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to load conversations:',
                expect.any(Error)
            );
        });

        it('should handle non-Error exceptions during loading', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockRejectedValue('String error');

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBe('Failed to load conversations');
        });

        it('should load empty conversations array', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue([]);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toEqual([]);
            expect(result.current.error).toBe(null);
        });
    });

    describe('createConversation', () => {
        it('should create a new conversation', async () => {
            const newConvId = 'conv-3';
            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce([
                    ...mockConversations,
                    {
                        id: newConvId,
                        title: 'New Conversation',
                        deploymentId: 'deploy-3',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        messageCount: 0,
                    },
                ]);

            vi.mocked(chatDB.chatDB.createConversation).mockResolvedValue(newConvId);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let returnedId: string = '';
            await act(async () => {
                returnedId = await result.current.createConversation(
                    'New Conversation',
                    'deploy-3'
                );
            });

            expect(returnedId).toBe(newConvId);
            expect(chatDB.chatDB.createConversation).toHaveBeenCalledWith(
                'New Conversation',
                'deploy-3'
            );
            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(2);
            expect(result.current.conversations).toHaveLength(3);
        });

        it('should return conversation ID from create operation', async () => {
            const expectedId = 'new-conv-id';
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.createConversation).mockResolvedValue(expectedId);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let conversationId: string = '';
            await act(async () => {
                conversationId = await result.current.createConversation('Test', 'deploy-1');
            });

            expect(conversationId).toBe(expectedId);
        });
    });

    describe('deleteConversation', () => {
        it('should delete a conversation', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce([mockConversations[1]]);

            vi.mocked(chatDB.chatDB.deleteConversation).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toHaveLength(2);

            await act(async () => {
                await result.current.deleteConversation('conv-1');
            });

            expect(chatDB.chatDB.deleteConversation).toHaveBeenCalledWith('conv-1');
            expect(result.current.conversations).toHaveLength(1);
            expect(result.current.conversations[0].id).toBe('conv-2');
        });


        it('should refresh conversation list after deletion', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce(mockConversations);

            vi.mocked(chatDB.chatDB.deleteConversation).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.deleteConversation('conv-1');
            });

            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateConversationTitle', () => {
        it('should update conversation title', async () => {
            const updatedConversations = [...mockConversations];
            updatedConversations[0] = {
                ...updatedConversations[0],
                title: 'Updated Title',
            };

            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce(updatedConversations);

            vi.mocked(chatDB.chatDB.updateConversationTitle).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.updateConversationTitle('conv-1', 'Updated Title');
            });

            expect(chatDB.chatDB.updateConversationTitle).toHaveBeenCalledWith(
                'conv-1',
                'Updated Title'
            );
            expect(result.current.conversations[0].title).toBe('Updated Title');
        });



        it('should refresh conversation list after update', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.updateConversationTitle).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.updateConversationTitle('conv-1', 'New Title');
            });

            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(2);
        });
    });

    describe('getConversation', () => {
        it('should get a single conversation', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getConversation).mockResolvedValue(mockConversations[0]);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let conversation: chatDB.ChatConversation | undefined;
            await act(async () => {
                conversation = await result.current.getConversation('conv-1');
            });

            expect(conversation).toEqual(mockConversations[0]);
            expect(chatDB.chatDB.getConversation).toHaveBeenCalledWith('conv-1');
        });

        it('should return undefined for non-existent conversation', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getConversation).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let conversation: chatDB.ChatConversation | undefined;
            await act(async () => {
                conversation = await result.current.getConversation('non-existent');
            });

            expect(conversation).toBeUndefined();
        });



        it('should not refresh conversation list after get', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getConversation).mockResolvedValue(mockConversations[0]);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.getConversation('conv-1');
            });

            // Should only be called once (on mount)
            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(1);
        });
    });

    describe('getMessages', () => {
        it('should get messages for a conversation', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getMessages).mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let messages: chatDB.ChatMessage[] = [];
            await act(async () => {
                messages = await result.current.getMessages('conv-1');
            });

            expect(messages).toEqual(mockMessages);
            expect(chatDB.chatDB.getMessages).toHaveBeenCalledWith('conv-1');
        });

        it('should return empty array for conversation with no messages', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getMessages).mockResolvedValue([]);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let messages: chatDB.ChatMessage[] = [];
            await act(async () => {
                messages = await result.current.getMessages('conv-2');
            });

            expect(messages).toEqual([]);
        });



        it('should not refresh conversation list after getting messages', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getMessages).mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.getMessages('conv-1');
            });

            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(1);
        });
    });

    describe('addMessage', () => {
        it('should add a user message', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.addMessage).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.addMessage('conv-1', 'user', 'Hello World');
            });

            expect(chatDB.chatDB.addMessage).toHaveBeenCalledWith(
                'conv-1',
                'user',
                'Hello World'
            );
        });

        it('should add an assistant message', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.addMessage).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.addMessage('conv-1', 'assistant', 'Response message');
            });

            expect(chatDB.chatDB.addMessage).toHaveBeenCalledWith(
                'conv-1',
                'assistant',
                'Response message'
            );
        });

        it('should add a system message', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.addMessage).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.addMessage('conv-1', 'system', 'System message');
            });

            expect(chatDB.chatDB.addMessage).toHaveBeenCalledWith(
                'conv-1',
                'system',
                'System message'
            );
        });



        it('should not refresh conversation list after adding message', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.addMessage).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.addMessage('conv-1', 'user', 'Test');
            });

            // Should only be called once (on mount), not after adding message
            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(1);
        });
    });

    describe('getStorageInfo', () => {
        it('should get storage information', async () => {
            const mockStorageInfo = {
                used: 1024000,
                quota: 5120000,
                percentage: 20,
            };

            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getStorageInfo).mockResolvedValue(mockStorageInfo);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let storageInfo: { used: number; quota: number; percentage: number } | null = null;
            await act(async () => {
                storageInfo = await result.current.getStorageInfo();
            });

            expect(storageInfo).toEqual(mockStorageInfo);
            expect(chatDB.chatDB.getStorageInfo).toHaveBeenCalled();
        });

        it('should return null and log error when storage info fails', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getStorageInfo).mockRejectedValue(
                new Error('Storage API not available')
            );

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let storageInfo: { used: number; quota: number; percentage: number } | null = null;
            await act(async () => {
                storageInfo = await result.current.getStorageInfo();
            });

            expect(storageInfo).toBe(null);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to get storage info:',
                expect.any(Error)
            );
        });

        it('should not set error state when storage info fails', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.getStorageInfo).mockRejectedValue(
                new Error('Storage API not available')
            );

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.getStorageInfo();
            });

            expect(result.current.error).toBe(null);
        });
    });

    describe('exportData', () => {
        it('should export data as Blob', async () => {
            const mockBlob = new Blob(['{"conversations": []}'], {
                type: 'application/json',
            });

            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);
            vi.mocked(chatDB.chatDB.exportData).mockResolvedValue(mockBlob);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            let blob: Blob | null = null;
            await act(async () => {
                blob = await result.current.exportData();
            });

            expect(blob).toBeInstanceOf(Blob);
            expect(blob?.type).toBe('application/json');
            expect(chatDB.chatDB.exportData).toHaveBeenCalled();
        });


    });

    describe('importData', () => {
        it('should import data from file', async () => {
            const mockFile = new File(
                ['{"conversations": []}'],
                'backup.json',
                { type: 'application/json' }
            );

            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce([...mockConversations]);

            vi.mocked(chatDB.chatDB.importData).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.importData(mockFile);
            });

            expect(chatDB.chatDB.importData).toHaveBeenCalledWith(mockFile);
            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(2);
        });

        it('should refresh conversation list after import', async () => {
            const mockFile = new File(['{}'], 'backup.json', { type: 'application/json' });
            const importedConversations = [
                ...mockConversations,
                {
                    id: 'conv-imported',
                    title: 'Imported Conversation',
                    deploymentId: 'deploy-3',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    messageCount: 10,
                },
            ];

            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce(importedConversations);

            vi.mocked(chatDB.chatDB.importData).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toHaveLength(2);

            await act(async () => {
                await result.current.importData(mockFile);
            });

            expect(result.current.conversations).toHaveLength(3);
        });


    });

    describe('clearAllData', () => {
        it('should clear all data', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce([]);

            vi.mocked(chatDB.chatDB.clearAllData).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toHaveLength(2);

            await act(async () => {
                await result.current.clearAllData();
            });

            expect(chatDB.chatDB.clearAllData).toHaveBeenCalled();
            expect(result.current.conversations).toEqual([]);
        });

        it('should refresh conversation list after clearing', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce([]);

            vi.mocked(chatDB.chatDB.clearAllData).mockResolvedValue(undefined);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.clearAllData();
            });

            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(2);
        });
    });

    describe('refresh', () => {
        it('should reload conversations', async () => {
            const updatedConversations = [
                ...mockConversations,
                {
                    id: 'conv-3',
                    title: 'New Conversation',
                    deploymentId: 'deploy-3',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    messageCount: 0,
                },
            ];

            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockResolvedValueOnce(updatedConversations);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.conversations).toHaveLength(2);

            await act(async () => {
                await result.current.refresh();
            });

            expect(result.current.conversations).toHaveLength(3);
            expect(chatDB.chatDB.getAllConversations).toHaveBeenCalledTimes(2);
        });

        it('should handle refresh failure', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations)
                .mockResolvedValueOnce(mockConversations)
                .mockRejectedValueOnce(new Error('Refresh failed'));

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.refresh();
            });

            await waitFor(() => {
                expect(result.current.error).toBe('Refresh failed');
            });
        });
    });

    describe('Function Stability', () => {
        it('should maintain stable function references across re-renders', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);

            const { result, rerender } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const firstFunctions = {
                createConversation: result.current.createConversation,
                deleteConversation: result.current.deleteConversation,
                updateConversationTitle: result.current.updateConversationTitle,
                getConversation: result.current.getConversation,
                getMessages: result.current.getMessages,
                addMessage: result.current.addMessage,
                getStorageInfo: result.current.getStorageInfo,
                exportData: result.current.exportData,
                importData: result.current.importData,
                clearAllData: result.current.clearAllData,
                refresh: result.current.refresh,
            };

            rerender();

            const secondFunctions = {
                createConversation: result.current.createConversation,
                deleteConversation: result.current.deleteConversation,
                updateConversationTitle: result.current.updateConversationTitle,
                getConversation: result.current.getConversation,
                getMessages: result.current.getMessages,
                addMessage: result.current.addMessage,
                getStorageInfo: result.current.getStorageInfo,
                exportData: result.current.exportData,
                importData: result.current.importData,
                clearAllData: result.current.clearAllData,
                refresh: result.current.refresh,
            };

            // All functions should maintain same reference due to useCallback
            expect(firstFunctions.createConversation).toBe(secondFunctions.createConversation);
            expect(firstFunctions.deleteConversation).toBe(secondFunctions.deleteConversation);
            expect(firstFunctions.updateConversationTitle).toBe(
                secondFunctions.updateConversationTitle
            );
            expect(firstFunctions.getConversation).toBe(secondFunctions.getConversation);
            expect(firstFunctions.getMessages).toBe(secondFunctions.getMessages);
            expect(firstFunctions.addMessage).toBe(secondFunctions.addMessage);
            expect(firstFunctions.getStorageInfo).toBe(secondFunctions.getStorageInfo);
            expect(firstFunctions.exportData).toBe(secondFunctions.exportData);
            expect(firstFunctions.importData).toBe(secondFunctions.importData);
            expect(firstFunctions.clearAllData).toBe(secondFunctions.clearAllData);
            expect(firstFunctions.refresh).toBe(secondFunctions.refresh);
        });
    });

    describe('Return Value Structure', () => {
        it('should return all required properties', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current).toHaveProperty('conversations');
            expect(result.current).toHaveProperty('loading');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('createConversation');
            expect(result.current).toHaveProperty('deleteConversation');
            expect(result.current).toHaveProperty('updateConversationTitle');
            expect(result.current).toHaveProperty('getConversation');
            expect(result.current).toHaveProperty('getMessages');
            expect(result.current).toHaveProperty('addMessage');
            expect(result.current).toHaveProperty('getStorageInfo');
            expect(result.current).toHaveProperty('exportData');
            expect(result.current).toHaveProperty('importData');
            expect(result.current).toHaveProperty('clearAllData');
            expect(result.current).toHaveProperty('refresh');
        });

        it('should have correct types for all properties', async () => {
            vi.mocked(chatDB.chatDB.getAllConversations).mockResolvedValue(mockConversations);

            const { result } = renderHook(() => useChatHistory());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(Array.isArray(result.current.conversations)).toBe(true);
            expect(typeof result.current.loading).toBe('boolean');
            expect(result.current.error === null || typeof result.current.error === 'string').toBe(
                true
            );
            expect(typeof result.current.createConversation).toBe('function');
            expect(typeof result.current.deleteConversation).toBe('function');
            expect(typeof result.current.updateConversationTitle).toBe('function');
            expect(typeof result.current.getConversation).toBe('function');
            expect(typeof result.current.getMessages).toBe('function');
            expect(typeof result.current.addMessage).toBe('function');
            expect(typeof result.current.getStorageInfo).toBe('function');
            expect(typeof result.current.exportData).toBe('function');
            expect(typeof result.current.importData).toBe('function');
            expect(typeof result.current.clearAllData).toBe('function');
            expect(typeof result.current.refresh).toBe('function');
        });
    });
});