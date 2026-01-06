import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear all toasts between tests by dismissing all and advancing timers
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
    act(() => {
      vi.runAllTimers();
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('reducer', () => {
    describe('ADD_TOAST', () => {
      it('should add a toast to empty state', () => {
        const initialState = { toasts: [] };
        const toast = { id: '1', title: 'Test Toast', open: true };

        const newState = reducer(initialState, {
          type: 'ADD_TOAST',
          toast,
        });

        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0]).toEqual(toast);
      });

      it('should enforce TOAST_LIMIT of 1', () => {
        const initialState = {
          toasts: [{ id: '1', title: 'First', open: true }],
        };
        const newToast = { id: '2', title: 'Second', open: true };

        const newState = reducer(initialState, {
          type: 'ADD_TOAST',
          toast: newToast,
        });

        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0].id).toBe('2');
      });

      it('should preserve toast properties', () => {
        const initialState = { toasts: [] };
        const toast = {
          id: '1',
          title: 'Test',
          description: 'Description',
          variant: 'destructive' as const,
          open: true,
        };

        const newState = reducer(initialState, {
          type: 'ADD_TOAST',
          toast,
        });

        expect(newState.toasts[0]).toEqual(toast);
      });
    });

    describe('UPDATE_TOAST', () => {
      it('should update a toast by id', () => {
        const initialState = {
          toasts: [
            { id: '1', title: 'Original', open: true },
            { id: '2', title: 'Other', open: true },
          ],
        };

        const newState = reducer(initialState, {
          type: 'UPDATE_TOAST',
          toast: { id: '1', title: 'Updated' },
        });

        expect(newState.toasts[0].title).toBe('Updated');
        expect(newState.toasts[1].title).toBe('Other');
      });

      it('should preserve unmodified properties', () => {
        const initialState = {
          toasts: [
            {
              id: '1',
              title: 'Original',
              description: 'Description',
              open: true,
            },
          ],
        };

        const newState = reducer(initialState, {
          type: 'UPDATE_TOAST',
          toast: { id: '1', title: 'Updated' },
        });

        expect(newState.toasts[0].title).toBe('Updated');
        expect(newState.toasts[0].description).toBe('Description');
        expect(newState.toasts[0].open).toBe(true);
      });

      it('should do nothing if toast id not found', () => {
        const initialState = {
          toasts: [{ id: '1', title: 'Original', open: true }],
        };

        const newState = reducer(initialState, {
          type: 'UPDATE_TOAST',
          toast: { id: '999', title: 'Updated' },
        });

        expect(newState.toasts[0].title).toBe('Original');
      });

      it('should update multiple properties at once', () => {
        const initialState = {
          toasts: [{ id: '1', title: 'Original', description: 'Old', open: true }],
        };

        const newState = reducer(initialState, {
          type: 'UPDATE_TOAST',
          toast: {
            id: '1',
            title: 'New Title',
            description: 'New Description',
          },
        });

        expect(newState.toasts[0].title).toBe('New Title');
        expect(newState.toasts[0].description).toBe('New Description');
      });
    });

    describe('DISMISS_TOAST', () => {
      it('should set open to false for specific toast', () => {
        const initialState = {
          toasts: [
            { id: '1', title: 'First', open: true },
            { id: '2', title: 'Second', open: true },
          ],
        };

        const newState = reducer(initialState, {
          type: 'DISMISS_TOAST',
          toastId: '1',
        });

        expect(newState.toasts[0].open).toBe(false);
        expect(newState.toasts[1].open).toBe(true);
      });

      it('should set open to false for all toasts when toastId is undefined', () => {
        const initialState = {
          toasts: [
            { id: '1', title: 'First', open: true },
            { id: '2', title: 'Second', open: true },
          ],
        };

        const newState = reducer(initialState, {
          type: 'DISMISS_TOAST',
        });

        expect(newState.toasts[0].open).toBe(false);
        expect(newState.toasts[1].open).toBe(false);
      });

      it('should preserve other toast properties', () => {
        const initialState = {
          toasts: [
            {
              id: '1',
              title: 'Test',
              description: 'Description',
              variant: 'destructive' as const,
              open: true,
            },
          ],
        };

        const newState = reducer(initialState, {
          type: 'DISMISS_TOAST',
          toastId: '1',
        });

        expect(newState.toasts[0].title).toBe('Test');
        expect(newState.toasts[0].description).toBe('Description');
        expect(newState.toasts[0].variant).toBe('destructive');
        expect(newState.toasts[0].open).toBe(false);
      });
    });

    describe('REMOVE_TOAST', () => {
      it('should remove a specific toast by id', () => {
        const initialState = {
          toasts: [
            { id: '1', title: 'First', open: true },
            { id: '2', title: 'Second', open: true },
          ],
        };

        const newState = reducer(initialState, {
          type: 'REMOVE_TOAST',
          toastId: '1',
        });

        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0].id).toBe('2');
      });

      it('should remove all toasts when toastId is undefined', () => {
        const initialState = {
          toasts: [
            { id: '1', title: 'First', open: true },
            { id: '2', title: 'Second', open: true },
          ],
        };

        const newState = reducer(initialState, {
          type: 'REMOVE_TOAST',
        });

        expect(newState.toasts).toHaveLength(0);
      });

      it('should do nothing if toast id not found', () => {
        const initialState = {
          toasts: [{ id: '1', title: 'First', open: true }],
        };

        const newState = reducer(initialState, {
          type: 'REMOVE_TOAST',
          toastId: '999',
        });

        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0].id).toBe('1');
      });
    });
  });

  describe('toast() function', () => {
    it('should create a toast with auto-generated id', () => {
      const result = toast({ title: 'Test Toast' });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('should return dismiss and update functions', () => {
      const result = toast({ title: 'Test Toast' });

      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    });

    it('should add toast to state', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Test Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
    });

    it('should set toast as open by default', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Test Toast' });
      });

      expect(result.current.toasts[0].open).toBe(true);
    });

    it('should create toast with description', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts[0].description).toBe('Test Description');
    });

    it('should create toast with variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: 'Test Toast',
          variant: 'destructive',
        });
      });

      expect(result.current.toasts[0].variant).toBe('destructive');
    });

    it('should generate unique ids for multiple toasts', () => {
      const result1 = toast({ title: 'First' });
      const result2 = toast({ title: 'Second' });
      const result3 = toast({ title: 'Third' });

      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
      expect(result1.id).not.toBe(result3.id);
    });

    describe('dismiss function', () => {
      it('should dismiss specific toast', () => {
        const { result } = renderHook(() => useToast());

        let toastResult: ReturnType<typeof toast>;
        act(() => {
          toastResult = toast({ title: 'Test Toast' });
        });

        act(() => {
          toastResult.dismiss();
        });

        expect(result.current.toasts[0].open).toBe(false);
      });

      it('should schedule toast removal after dismiss', () => {
        const { result } = renderHook(() => useToast());

        let toastResult: ReturnType<typeof toast>;
        act(() => {
          toastResult = toast({ title: 'Test Toast' });
        });

        act(() => {
          toastResult.dismiss();
        });

        expect(result.current.toasts).toHaveLength(1);

        act(() => {
          vi.advanceTimersByTime(1000000);
        });

        expect(result.current.toasts).toHaveLength(0);
      });
    });

    describe('update function', () => {
      it('should update toast title', () => {
        const { result } = renderHook(() => useToast());

        let toastResult: ReturnType<typeof toast>;
        act(() => {
          toastResult = toast({ title: 'Original Title' });
        });

        act(() => {
          toastResult.update({
            id: toastResult.id,
            title: 'Updated Title',
          });
        });

        expect(result.current.toasts[0].title).toBe('Updated Title');
      });

      it('should update toast description', () => {
        const { result } = renderHook(() => useToast());

        let toastResult: ReturnType<typeof toast>;
        act(() => {
          toastResult = toast({
            title: 'Title',
            description: 'Original',
          });
        });

        act(() => {
          toastResult.update({
            id: toastResult.id,
            description: 'Updated',
          });
        });

        expect(result.current.toasts[0].description).toBe('Updated');
      });

      it('should update multiple properties', () => {
        const { result } = renderHook(() => useToast());

        let toastResult: ReturnType<typeof toast>;
        act(() => {
          toastResult = toast({
            title: 'Original',
            description: 'Description',
          });
        });

        act(() => {
          toastResult.update({
            id: toastResult.id,
            title: 'New Title',
            description: 'New Description',
            variant: 'destructive',
          });
        });

        expect(result.current.toasts[0].title).toBe('New Title');
        expect(result.current.toasts[0].description).toBe('New Description');
        expect(result.current.toasts[0].variant).toBe('destructive');
      });
    });

    describe('onOpenChange callback', () => {
      it('should dismiss toast when onOpenChange is called with false', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          toast({ title: 'Test Toast' });
        });

        const onOpenChange = result.current.toasts[0].onOpenChange;

        act(() => {
          onOpenChange?.(false);
        });

        expect(result.current.toasts[0].open).toBe(false);
      });

      it('should not affect toast when onOpenChange is called with true', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          toast({ title: 'Test Toast' });
        });

        const onOpenChange = result.current.toasts[0].onOpenChange;
        const initialOpen = result.current.toasts[0].open;

        act(() => {
          onOpenChange?.(true);
        });

        expect(result.current.toasts[0].open).toBe(initialOpen);
      });
    });
  });

  describe('useToast hook', () => {
    it('should return initial empty state', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });

    it('should return toast function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.toast).toBe('function');
    });

    it('should return dismiss function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should update when toast is added', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should dismiss specific toast by id', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' });
        toastId = toastResult.id;
      });

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'First' });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('Toast Limit', () => {
    it('should only keep one toast at a time', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'First' });
        result.current.toast({ title: 'Second' });
        result.current.toast({ title: 'Third' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Third');
    });

    it('should replace oldest toast with newest', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'First' });
      });

      expect(result.current.toasts[0].title).toBe('First');

      act(() => {
        result.current.toast({ title: 'Second' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Second');
    });
  });

  describe('Toast Removal Delay', () => {
    it('should remove toast after TOAST_REMOVE_DELAY when dismissed', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not remove toast before delay expires', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      act(() => {
        result.current.dismiss();
      });

      act(() => {
        vi.advanceTimersByTime(500000); // Half the delay
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should handle multiple dismissals with separate timers', () => {
      const { result } = renderHook(() => useToast());

      let toast1Id: string;
      act(() => {
        const t1 = result.current.toast({ title: 'First' });
        toast1Id = t1.id;
      });

      act(() => {
        result.current.dismiss(toast1Id);
      });

      act(() => {
        vi.advanceTimersByTime(500000);
      });

      act(() => {
        result.current.toast({ title: 'Second' });
      });

      act(() => {
        vi.advanceTimersByTime(500000); // Total 1000000 for first toast
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Second');
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should sync state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: 'Test Toast' });
      });

      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result2.current.toasts[0].title).toBe('Test Toast');
    });

    it('should update all instances when toast is dismissed', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: 'Test Toast' });
      });

      act(() => {
        result2.current.dismiss();
      });

      expect(result1.current.toasts[0].open).toBe(false);
      expect(result2.current.toasts[0].open).toBe(false);
    });

    it('should update all instances when toast is updated', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      let toastResult: ReturnType<typeof toast>;
      act(() => {
        toastResult = result1.current.toast({ title: 'Original' });
      });

      act(() => {
        toastResult.update({
          id: toastResult.id,
          title: 'Updated',
        });
      });

      expect(result1.current.toasts[0].title).toBe('Updated');
      expect(result2.current.toasts[0].title).toBe('Updated');
    });

    it('should clean up listeners on unmount', () => {
      const { result: result1, unmount: unmount1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: 'Test' });
      });

      unmount1();

      act(() => {
        result2.current.toast({ title: 'After Unmount' });
      });

      // Should not throw error
      expect(result2.current.toasts[0].title).toBe('After Unmount');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty toast object', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({});
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('should handle toast with only title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Only Title' });
      });

      expect(result.current.toasts[0].title).toBe('Only Title');
      expect(result.current.toasts[0].description).toBeUndefined();
    });

    it('should handle toast with React nodes as title', () => {
      const { result } = renderHook(() => useToast());

      const titleNode = <div>React Node Title</div>;

      act(() => {
        result.current.toast({ title: titleNode });
      });

      expect(result.current.toasts[0].title).toBe(titleNode);
    });

    it('should handle rapid consecutive toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'First' });
        result.current.toast({ title: 'Second' });
        result.current.toast({ title: 'Third' });
        result.current.toast({ title: 'Fourth' });
        result.current.toast({ title: 'Fifth' });
      });

      // Should only keep the last one due to TOAST_LIMIT
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Fifth');
    });

    it('should handle dismissing non-existent toast gracefully', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test' });
      });

      act(() => {
        result.current.dismiss('non-existent-id');
      });

      // Original toast should remain unchanged
      expect(result.current.toasts[0].open).toBe(true);
    });

  });

  describe('Memory Management', () => {
    it('should clear timeout when toast is dismissed', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test' });
      });

      act(() => {
        result.current.dismiss();
      });

      act(() => {
        vi.advanceTimersByTime(1000000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not create duplicate timeouts for same toast', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const t = result.current.toast({ title: 'Test' });
        toastId = t.id;
      });

      act(() => {
        result.current.dismiss(toastId);
        result.current.dismiss(toastId);
        result.current.dismiss(toastId);
      });

      act(() => {
        vi.advanceTimersByTime(1000000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('ID Generation', () => {
    it('should generate sequential numeric string ids', () => {
      const id1 = toast({ title: 'First' }).id;
      const id2 = toast({ title: 'Second' }).id;
      const id3 = toast({ title: 'Third' }).id;

      expect(parseInt(id1)).toBeLessThan(parseInt(id2));
      expect(parseInt(id2)).toBeLessThan(parseInt(id3));
    });

    it('should generate valid string ids', () => {
      const toastResult = toast({ title: 'Test' });

      expect(typeof toastResult.id).toBe('string');
      expect(toastResult.id.length).toBeGreaterThan(0);
      expect(isNaN(parseInt(toastResult.id))).toBe(false);
    });
  });
});