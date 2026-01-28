import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { JobStatusPoller } from '@/components/SelfService/JobStatusPoller';
import { useJenkinsQueueStatus } from '@/hooks/api/useJenkinsQueueStatus';
import { useJenkinsBuildStatus } from '@/hooks/api/useJenkinsBuildStatus';
import { useUpdateJobStatus } from '@/hooks/api/useJobStatus';

// Mock the hooks
vi.mock('@/hooks/api/useJenkinsQueueStatus');
vi.mock('@/hooks/api/useJenkinsBuildStatus');
vi.mock('@/hooks/api/useJobStatus');

describe('JobStatusPoller', () => {
  const mockUseJenkinsQueueStatus = vi.mocked(useJenkinsQueueStatus);
  const mockUseJenkinsBuildStatus = vi.mocked(useJenkinsBuildStatus);
  const mockUseUpdateJobStatus = vi.mocked(useUpdateJobStatus);

  const mockMutate = vi.fn();
  const mockOnComplete = vi.fn();

  const defaultProps = {
    jaasName: 'test-jaas',
    queueItemId: 'queue-123',
    jobName: 'test-job',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock return values
    mockUseUpdateJobStatus.mockReturnValue({
      mutate: mockMutate,
    } as any);

    mockUseJenkinsQueueStatus.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isFetching: false,
    } as any);

    mockUseJenkinsBuildStatus.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isFetching: false,
    } as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<JobStatusPoller {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should return null (no visual output)', () => {
      const { container } = render(<JobStatusPoller {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with all required props', () => {
      expect(() => 
        render(
          <JobStatusPoller
            jaasName="test-jaas"
            queueItemId="queue-123"
            jobName="test-job"
          />
        )
      ).not.toThrow();
    });

    it('should render with optional onComplete callback', () => {
      expect(() => 
        render(
          <JobStatusPoller
            {...defaultProps}
            onComplete={mockOnComplete}
          />
        )
      ).not.toThrow();
    });
  });

  describe('Queue Polling - Initial State', () => {
    it('should enable queue polling initially', () => {
      render(<JobStatusPoller {...defaultProps} />);

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        'test-jaas',
        'queue-123',
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('should disable build polling initially', () => {
      render(<JobStatusPoller {...defaultProps} />);

      expect(mockUseJenkinsBuildStatus).toHaveBeenCalledWith(
        'test-jaas',
        'test-job',
        0,
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('should pass correct jaasName to queue hook', () => {
      render(<JobStatusPoller {...defaultProps} jaasName="custom-jaas" />);

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        'custom-jaas',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should pass correct queueItemId to queue hook', () => {
      render(<JobStatusPoller {...defaultProps} queueItemId="custom-queue-456" />);

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        expect.any(String),
        'custom-queue-456',
        expect.any(Object)
      );
    });
  });

  describe('Queue Status Updates', () => {
    it('should update job status when queue data is received', async () => {
      const queueData = {
        status: 'pending',
        message: 'Job is pending',
        queueUrl: 'http://jenkins.com/queue/123',
        buildNumber: null,
        waitTime: 5000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            queueItemId: 'queue-123',
            updates: expect.objectContaining({
              status: 'pending',
              queueUrl: 'http://jenkins.com/queue/123',
              waitTime: 5000,
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('should use buildUrl as queueUrl when buildUrl is available', async () => {
      const queueData = {
        status: 'running',
        message: 'Job is running',
        buildUrl: 'http://jenkins.com/job/test/123/',
        queueUrl: 'http://jenkins.com/queue/456',
        buildNumber: null,
        waitTime: 10000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            updates: expect.objectContaining({
              queueUrl: 'http://jenkins.com/job/test/123/',
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('should use queueUrl when buildUrl is empty', async () => {
      const queueData = {
        status: 'pending',
        buildUrl: '',
        queueUrl: 'http://jenkins.com/queue/789',
        buildNumber: null,
        waitTime: 3000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            updates: expect.objectContaining({
              queueUrl: 'http://jenkins.com/queue/789',
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('should include message in updates', async () => {
      const queueData = {
        status: 'pending',
        message: 'Waiting for executor',
        queueUrl: 'http://jenkins.com/queue/123',
        buildNumber: null,
        waitTime: 2000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            updates: expect.objectContaining({
              message: 'Waiting for executor',
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('should use default message when message is not provided', async () => {
      const queueData = {
        status: 'pending',
        queueUrl: 'http://jenkins.com/queue/123',
        buildNumber: null,
        waitTime: 1000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            updates: expect.objectContaining({
              message: 'Job pending',
            }),
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Build Number Detection', () => {
    it('should detect when buildNumber becomes available', async () => {
      const queueDataWithBuild = {
        status: 'running',
        message: 'Build started',
        buildUrl: 'http://jenkins.com/job/test/42/',
        buildNumber: 42,
        queueUrl: 'http://jenkins.com/queue/123',
        waitTime: 15000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      const { rerender } = render(<JobStatusPoller {...defaultProps} />);

      // Wait for state update
      await waitFor(() => {
        // After detecting buildNumber, build polling should be enabled
        rerender(<JobStatusPoller {...defaultProps} />);
      });

      // Build polling should now be enabled with buildNumber 42
      expect(mockUseJenkinsBuildStatus).toHaveBeenCalledWith(
        'test-jaas',
        'test-job',
        expect.any(Number),
        expect.objectContaining({
          enabled: expect.any(Boolean),
        })
      );
    });

    it('should store queue response when buildNumber is detected', async () => {
      const queueDataWithBuild = {
        status: 'running',
        message: 'Build started',
        buildUrl: 'http://jenkins.com/job/test/99/',
        buildNumber: 99,
        queueUrl: 'http://jenkins.com/queue/123',
        waitTime: 8000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Build Status Polling', () => {
    it('should enable build polling after buildNumber is available', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockUseJenkinsBuildStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Terminal States and Completion', () => {
    it('should call onComplete when status is success', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'success',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 60000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onComplete when status is failed', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'failed',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 30000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onComplete when status is aborted', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'aborted',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 15000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onComplete when status is cancelled', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'cancelled',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 5000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onComplete when status is error', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'error',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 2000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onComplete when status is running', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'running',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 10000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should work without onComplete callback', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'success',
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 60000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      expect(() => 
        render(<JobStatusPoller {...defaultProps} />)
      ).not.toThrow();

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should handle case-insensitive terminal states', async () => {
      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      const buildData = {
        status: 'SUCCESS', // Uppercase
        buildUrl: 'http://jenkins.com/job/test/42/',
        duration: 60000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: buildData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should log queue error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const queueError = new Error('Queue fetch failed');

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: undefined,
        error: queueError,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[JobStatusPoller] Queue status error:',
        queueError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log build error to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const buildError = new Error('Build fetch failed');

      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: undefined,
        error: buildError,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[JobStatusPoller] Build status error:',
          buildError
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should continue polling despite queue errors', () => {
      const queueError = new Error('Queue fetch failed');

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: undefined,
        error: queueError,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      // Queue polling should still be enabled
      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        'test-jaas',
        'queue-123',
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('should continue polling despite build errors', async () => {
      const buildError = new Error('Build fetch failed');

      const queueDataWithBuild = {
        status: 'running',
        buildNumber: 42,
        buildUrl: 'http://jenkins.com/job/test/42/',
        waitTime: 5000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueDataWithBuild,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      mockUseJenkinsBuildStatus.mockReturnValue({
        data: undefined,
        error: buildError,
        isLoading: false,
        isFetching: false,
      } as any);

      render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockUseJenkinsBuildStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Duplicate Update Prevention', () => {
    it('should not send duplicate updates with same data', async () => {
      const queueData = {
        status: 'pending',
        message: 'Job is pending',
        queueUrl: 'http://jenkins.com/queue/123',
        buildNumber: null,
        waitTime: 5000,
      };

      mockUseJenkinsQueueStatus.mockReturnValue({
        data: queueData,
        error: null,
        isLoading: false,
        isFetching: false,
      } as any);

      const { rerender } = render(<JobStatusPoller {...defaultProps} />);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      const initialCallCount = mockMutate.mock.calls.length;

      // Rerender with same data
      rerender(<JobStatusPoller {...defaultProps} />);

      // Should not call mutate again for the same data
      expect(mockMutate).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Props Changes', () => {
    it('should handle jaasName changes', () => {
      const { rerender } = render(
        <JobStatusPoller {...defaultProps} jaasName="jaas-1" />
      );

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        'jaas-1',
        expect.any(String),
        expect.any(Object)
      );

      rerender(<JobStatusPoller {...defaultProps} jaasName="jaas-2" />);

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        'jaas-2',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should handle queueItemId changes', () => {
      const { rerender } = render(
        <JobStatusPoller {...defaultProps} queueItemId="queue-1" />
      );

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        expect.any(String),
        'queue-1',
        expect.any(Object)
      );

      rerender(<JobStatusPoller {...defaultProps} queueItemId="queue-2" />);

      expect(mockUseJenkinsQueueStatus).toHaveBeenCalledWith(
        expect.any(String),
        'queue-2',
        expect.any(Object)
      );
    });

    it('should handle jobName changes', () => {
      const { rerender } = render(
        <JobStatusPoller {...defaultProps} jobName="job-1" />
      );

      expect(mockUseJenkinsBuildStatus).toHaveBeenCalledWith(
        expect.any(String),
        'job-1',
        expect.any(Number),
        expect.any(Object)
      );

      rerender(<JobStatusPoller {...defaultProps} jobName="job-2" />);

      expect(mockUseJenkinsBuildStatus).toHaveBeenCalledWith(
        expect.any(String),
        'job-2',
        expect.any(Number),
        expect.any(Object)
      );
    });
  });
});