import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../src/hooks/useDebounce';

// ============================================================================
// MAIN TESTS
// ============================================================================

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ============================================================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================================================

  it('should debounce with default and custom delays', () => {
    const callback = vi.fn();
    
    // Test default delay (500ms)
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledWith('updated');

    // Test custom delay
    const { rerender: rerender2 } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 1000 }),
      { initialProps: { value: 'test' } }
    );

    rerender2({ value: 'custom' });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still only once from before

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledWith('custom');
  });

  it('should debounce rapid changes and cancel previous timeouts', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 300 }),
      { initialProps: { value: 'initial' } }
    );

    // Rapid changes
    rerender({ value: 'change1' });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'change2' });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'final' });
    
    // Should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Complete the delay from the last change
    act(() => { vi.advanceTimersByTime(300); });

    // Should only be called once with the final value
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('final');
  });

  // ============================================================================
  // CALLBACK REFERENCE TESTS
  // ============================================================================

  it('should use the latest callback reference', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    
    const { rerender } = renderHook(
      ({ value, cb }) => useDebounce(value, cb, { delay: 300 }),
      { initialProps: { value: 'test', cb: callback1 } }
    );

    // Change the callback before timeout
    rerender({ value: 'test', cb: callback2 });

    // Trigger the timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should call the latest callback, not the original one
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith('test');
  });

  it('should handle callback changes without retriggering timeout', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    
    const { rerender } = renderHook(
      ({ value, cb }) => useDebounce(value, cb, { delay: 300 }),
      { initialProps: { value: 'test', cb: callback1 } }
    );

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Change only the callback, not the value
    rerender({ value: 'test', cb: callback2 });

    // Complete the remaining time
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Should call the new callback with the original value
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith('test');
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn();
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 500 }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Unmount before timeout completes
    unmount();

    // Complete the timeout duration
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle multiple mount/unmount cycles', () => {
    const callback = vi.fn();
    
    // First mount
    const { unmount: unmount1, rerender: rerender1 } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 300 }),
      { initialProps: { value: 'first' } }
    );

    rerender1({ value: 'updated1' });
    unmount1();

    // Second mount
    const { unmount: unmount2, rerender: rerender2 } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 300 }),
      { initialProps: { value: 'second' } }
    );

    rerender2({ value: 'updated2' });

    // Complete timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Only the second hook's callback should be called
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('updated2');

    unmount2();
  });

  // ============================================================================
  // EDGE CASES AND TYPE TESTS
  // ============================================================================

  it('should work with different value types', () => {
    const callback = vi.fn();

    // Test with number
    const { rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 100 }),
      { initialProps: { value: 42 } }
    );

    rerenderNumber({ value: 84 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledWith(84);

    // Test with object
    const { rerender: rerenderObject } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 100 }),
      { initialProps: { value: { id: 1 } } }
    );

    const newObj = { id: 2 };
    rerenderObject({ value: newObj });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledWith(newObj);

    // Test with array
    const { rerender: rerenderArray } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 100 }),
      { initialProps: { value: [1, 2, 3] } }
    );

    const newArray = [4, 5, 6];
    rerenderArray({ value: newArray });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledWith(newArray);
  });

  it('should handle zero delay', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 0 }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // With zero delay, should be called immediately on next tick
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('updated');
  });

  it('should handle undefined options', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Should use default delay of 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('updated');
  });

  it('should handle same value updates', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 300 }),
      { initialProps: { value: 'same' } }
    );

    // Update with the same value
    rerender({ value: 'same' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should still call the callback
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('same');
  });

  it('should handle delay changes', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, callback, { delay }),
      { initialProps: { value: 'test', delay: 500 } }
    );

    // Change delay before timeout
    rerender({ value: 'test', delay: 200 });

    // Use the new delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test');
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  it('should not create memory leaks with rapid changes', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebounce(value, callback, { delay: 100 }),
      { initialProps: { value: 'initial' } }
    );

    // Simulate rapid changes
    for (let i = 0; i < 100; i++) {
      rerender({ value: `value-${i}` });
      act(() => {
        vi.advanceTimersByTime(10);
      });
    }

    // Complete the final timeout
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should only be called once with the final value
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('value-99');
  });
});
