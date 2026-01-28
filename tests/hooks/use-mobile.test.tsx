import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: {
    matches: boolean;
    media: string;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    dispatchEvent: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create a mock matchMedia object
    matchMediaMock = {
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => {
        matchMediaMock.media = query;
        return matchMediaMock;
      }),
    });

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return false initially when window width is above mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should return true initially when window width is below mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return false when window width is exactly at mobile breakpoint (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should return true when window width is one pixel below mobile breakpoint (767px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });
  });

  describe('Media Query Setup', () => {
    it('should set up matchMedia with correct query', () => {
      renderHook(() => useIsMobile());

      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should add event listener to matchMedia', () => {
      renderHook(() => useIsMobile());

      expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Window Resize Behavior', () => {
    it('should update to mobile when window is resized below breakpoint', async () => {
      // Start with desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      // Trigger the change event
      const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1];
      changeHandler();

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should update to desktop when window is resized above breakpoint', async () => {
      // Start with mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Simulate resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      // Trigger the change event
      const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1];
      changeHandler();

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should handle multiple resize events', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1];

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      changeHandler();

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Resize back to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      changeHandler();

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // Resize to mobile again
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      changeHandler();

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle window width of 0', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should handle very large window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 5000,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should handle decimal window widths', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767.5,
      });

      const { result } = renderHook(() => useIsMobile());

      // 767.5 < 768, so should be mobile
      expect(result.current).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useIsMobile());

      expect(matchMediaMock.addEventListener).toHaveBeenCalled();

      unmount();

      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should remove the same handler that was added', () => {
      const { unmount } = renderHook(() => useIsMobile());

      const addedHandler = matchMediaMock.addEventListener.mock.calls[0][1];

      unmount();

      const removedHandler = matchMediaMock.removeEventListener.mock.calls[0][1];

      expect(addedHandler).toBe(removedHandler);
    });

    it('should only call removeEventListener once on unmount', () => {
      const { unmount } = renderHook(() => useIsMobile());

      unmount();

      expect(matchMediaMock.removeEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Re-render Behavior', () => {
    it('should not set up new listeners on re-render', () => {
      const { rerender } = renderHook(() => useIsMobile());

      expect(matchMediaMock.addEventListener).toHaveBeenCalledTimes(1);

      rerender();

      // Should still only be called once due to empty dependency array
      expect(matchMediaMock.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should maintain state across re-renders', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result, rerender } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);

      rerender();

      expect(result.current).toBe(true);
    });
  });

  describe('Return Value', () => {
    it('should always return a boolean, never undefined after initial render', () => {
      const { result } = renderHook(() => useIsMobile());

      expect(typeof result.current).toBe('boolean');
      expect(result.current).not.toBe(undefined);
    });

    it('should coerce undefined to false using !! operator', () => {
      // Even though internal state might be undefined initially,
      // the hook should return false (!!undefined = false)
      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe('Breakpoint Boundaries', () => {
    const testCases = [
      { width: 766, expected: true, description: 'two pixels below breakpoint' },
      { width: 767, expected: true, description: 'one pixel below breakpoint' },
      { width: 768, expected: false, description: 'at breakpoint' },
      { width: 769, expected: false, description: 'one pixel above breakpoint' },
      { width: 770, expected: false, description: 'two pixels above breakpoint' },
    ];

    testCases.forEach(({ width, expected, description }) => {
      it(`should return ${expected} when width is ${width}px (${description})`, () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(expected);
      });
    });
  });

  describe('Common Device Widths', () => {
    const deviceWidths = [
      { name: 'iPhone SE', width: 375, expected: true },
      { name: 'iPhone 12/13/14', width: 390, expected: true },
      { name: 'iPhone 12/13/14 Pro Max', width: 428, expected: true },
      { name: 'iPad Mini', width: 744, expected: true },
      { name: 'iPad', width: 768, expected: false },
      { name: 'iPad Air/Pro', width: 820, expected: false },
      { name: 'iPad Pro 12.9"', width: 1024, expected: false },
      { name: 'Laptop', width: 1280, expected: false },
      { name: 'Desktop', width: 1920, expected: false },
    ];

    deviceWidths.forEach(({ name, width, expected }) => {
      it(`should return ${expected} for ${name} (${width}px)`, () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(expected);
      });
    });
  });

  describe('Performance', () => {
    it('should only query window.innerWidth when necessary', () => {
      const innerWidthSpy = vi.spyOn(window, 'innerWidth', 'get');

      renderHook(() => useIsMobile());

      // Should be called at least once during setup
      expect(innerWidthSpy).toHaveBeenCalled();
      
      innerWidthSpy.mockRestore();
    });

    it('should use the same matchMedia instance throughout lifecycle', () => {
      const { unmount } = renderHook(() => useIsMobile());

      // matchMedia should be called once to create the instance
      expect(window.matchMedia).toHaveBeenCalledTimes(1);

      // Get the handler from addEventListener
      const addedHandler = matchMediaMock.addEventListener.mock.calls[0][1];

      unmount();

      // Get the handler from removeEventListener
      const removedHandler = matchMediaMock.removeEventListener.mock.calls[0][1];

      // Should be the same handler reference (no new closures created)
      expect(addedHandler).toBe(removedHandler);
    });
  });

  describe('Concurrent Hooks', () => {
    it('should work correctly when multiple hooks are mounted', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result: result1 } = renderHook(() => useIsMobile());
      const { result: result2 } = renderHook(() => useIsMobile());
      const { result: result3 } = renderHook(() => useIsMobile());

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result3.current).toBe(true);
    });

    it('should independently update multiple hook instances on resize', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result: result1 } = renderHook(() => useIsMobile());
      const { result: result2 } = renderHook(() => useIsMobile());

      expect(result1.current).toBe(false);
      expect(result2.current).toBe(false);

      // Simulate resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      // Trigger all change handlers
      const handler1 = matchMediaMock.addEventListener.mock.calls[0][1];
      const handler2 = matchMediaMock.addEventListener.mock.calls[1][1];
      
      handler1();
      handler2();

      await waitFor(() => {
        expect(result1.current).toBe(true);
        expect(result2.current).toBe(true);
      });
    });
  });
});