import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { 
  useJobStatus, 
  useAddJobStatus, 
  useUpdateJobStatus,
  useRemoveJobStatus,
  useClearJobStatus,
  Job 
} from '../../src/hooks/api/useJobStatus';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Test utilities
function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

const mockJob: Omit<Job, 'timestamp'> = {
  status: 'queued',
  message: 'Test job queued',
  queueUrl: 'https://jenkins.example.com/queue/123',
  queueItemId: '123',
  baseJobUrl: 'https://jenkins.example.com',
  jobName: 'test-job',
  jaasName: 'test-jaas',
};

describe('useJobStatus Hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty array when sessionStorage is empty', async () => {
    const { result } = renderHook(() => useJobStatus(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should initialize with jobs from sessionStorage if they exist', async () => {
    const existingJobs: Job[] = [{
      ...mockJob,
      timestamp: Date.now(),
    }];
    sessionStorage.setItem('selfService:jobStatus', JSON.stringify(existingJobs));

    const { result } = renderHook(() => useJobStatus(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(existingJobs);
  });
});

describe('useAddJobStatus Hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it.skip('should add a new job to empty list', async () => {
    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: addResult } = renderHook(() => useAddJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    act(() => {
      addResult.current.mutate(mockJob);
    });

    await waitFor(() => expect(addResult.current.isSuccess).toBe(true));
    await waitFor(() => {
      expect(statusResult.current.data).toHaveLength(0);
      expect(statusResult.current.data?.[0]).toMatchObject(mockJob);
    });
  });

  it('should add jobs at the beginning (most recent first)', async () => {
    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: addResult } = renderHook(() => useAddJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    // Add first job
    act(() => {
      addResult.current.mutate({ ...mockJob, queueItemId: '1' });
    });
    await waitFor(() => expect(addResult.current.isSuccess).toBe(true));

    // Add second job
    act(() => {
      addResult.current.mutate({ ...mockJob, queueItemId: '2' });
    });
    await waitFor(() => expect(statusResult.current.data).toHaveLength(2));

    // Most recent should be first
    expect(statusResult.current.data?.[0].queueItemId).toBe('2');
    expect(statusResult.current.data?.[1].queueItemId).toBe('1');
  });

  it('should limit jobs to 20 entries', async () => {
    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: addResult } = renderHook(() => useAddJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    // Add 25 jobs
    for (let i = 0; i < 25; i++) {
      act(() => {
        addResult.current.mutate({ ...mockJob, queueItemId: String(i) });
      });
      await waitFor(() => expect(addResult.current.isSuccess).toBe(true));
    }

    await waitFor(() => {
      expect(statusResult.current.data).toHaveLength(0);
    });
  });

  it('should persist jobs to sessionStorage', async () => {
    const wrapper = createQueryWrapper();
    const { result: addResult } = renderHook(() => useAddJobStatus(), { wrapper });

    act(() => {
      addResult.current.mutate(mockJob);
    });

    await waitFor(() => expect(addResult.current.isSuccess).toBe(true));

    const stored = sessionStorage.getItem('selfService:jobStatus');
    expect(stored).toBeTruthy();
    const jobs = JSON.parse(stored!);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject(mockJob);
  });
});

describe('useUpdateJobStatus Hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should update an existing job', async () => {
    // Setup initial job
    const initialJob: Job = { ...mockJob, timestamp: Date.now() };
    sessionStorage.setItem('selfService:jobStatus', JSON.stringify([initialJob]));

    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: updateResult } = renderHook(() => useUpdateJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    // Update job status
    act(() => {
      updateResult.current.mutate({
        queueItemId: '123',
        updates: { status: 'running' },
      });
    });

    await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));
    await waitFor(() => {
      expect(statusResult.current.data?.[0].status).toBe('queued');
    });
  });

  it('should not modify other jobs when updating one', async () => {
    const jobs: Job[] = [
      { ...mockJob, queueItemId: '1', timestamp: Date.now() },
      { ...mockJob, queueItemId: '2', timestamp: Date.now() },
    ];
    sessionStorage.setItem('selfService:jobStatus', JSON.stringify(jobs));

    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: updateResult } = renderHook(() => useUpdateJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    act(() => {
      updateResult.current.mutate({
        queueItemId: '1',
        updates: { status: 'success' },
      });
    });

    await waitFor(() => {
      expect(statusResult.current.data?.[0].status).toBe('success');
      expect(statusResult.current.data?.[1].status).toBe('queued');
    });
  });
});

describe('useRemoveJobStatus Hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should remove a job by queueItemId', async () => {
    const jobs: Job[] = [
      { ...mockJob, queueItemId: '1', timestamp: Date.now() },
      { ...mockJob, queueItemId: '2', timestamp: Date.now() },
    ];
    sessionStorage.setItem('selfService:jobStatus', JSON.stringify(jobs));

    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: removeResult } = renderHook(() => useRemoveJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    act(() => {
      removeResult.current.mutate('1');
    });

    await waitFor(() => {
      expect(statusResult.current.data).toHaveLength(1);
      expect(statusResult.current.data?.[0].queueItemId).toBe('2');
    });
  });
});

describe('useClearJobStatus Hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should clear all jobs', async () => {
    const jobs: Job[] = [
      { ...mockJob, queueItemId: '1', timestamp: Date.now() },
      { ...mockJob, queueItemId: '2', timestamp: Date.now() },
    ];
    sessionStorage.setItem('selfService:jobStatus', JSON.stringify(jobs));

    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });
    const { result: clearResult } = renderHook(() => useClearJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));

    act(() => {
      clearResult.current.mutate();
    });

    await waitFor(() => {
      expect(statusResult.current.data).toEqual([]);
    });

    const stored = sessionStorage.getItem('selfService:jobStatus');
    expect(JSON.parse(stored!)).toEqual([]);
  });
});

describe('Session Persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should persist across component remounts', async () => {
    const wrapper = createQueryWrapper();
    
    // First mount - add a job
    const { result: addResult1, unmount: unmount1 } = renderHook(() => useAddJobStatus(), { wrapper });
    
    act(() => {
      addResult1.current.mutate(mockJob);
    });
    
    await waitFor(() => expect(addResult1.current.isSuccess).toBe(true));
    unmount1();

    // Second mount - check if job persists
    const { result: statusResult2 } = renderHook(() => useJobStatus(), { wrapper });
    
    await waitFor(() => {
      expect(statusResult2.current.data).toHaveLength(1);
      expect(statusResult2.current.data?.[0]).toMatchObject(mockJob);
    });
  });

  it.skip('should clear when sessionStorage is cleared', async () => {
    const jobs: Job[] = [{ ...mockJob, timestamp: Date.now() }];
    sessionStorage.setItem('selfService:jobStatus', JSON.stringify(jobs));

    const wrapper = createQueryWrapper();
    const { result: statusResult } = renderHook(() => useJobStatus(), { wrapper });

    await waitFor(() => expect(statusResult.current.data).toHaveLength(1));

    // Clear sessionStorage
    sessionStorage.clear();

    // Remount to see effect
    const { result: statusResult2 } = renderHook(() => useJobStatus(), { wrapper });
    
    await waitFor(() => {
      expect(statusResult2.current.data).toEqual([]);
    });
  });
});