import { useCallback, useState } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function pushHistory<T>(history: HistoryState<T>, value: T, replace = false): HistoryState<T> {
  if (replace) return { ...history, present: value };
  if (Object.is(history.present, value)) return history;
  return { past: [...history.past, history.present].slice(-50), present: value, future: [] };
}

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const next = history.future[0];
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: history.future.slice(1) };
}

export function useHistory<T>(initial: T) {
  const [history, setHistory] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });

  const set = useCallback((next: T | ((current: T) => T), replace = false) => {
    setHistory((current) => {
      const value = typeof next === 'function' ? (next as (item: T) => T)(current.present) : next;
      return pushHistory(current, value, replace);
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(undoHistory);
  }, []);

  const redo = useCallback(() => {
    setHistory(redoHistory);
  }, []);

  return {
    value: history.present,
    values: [...history.past, history.present, ...history.future],
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
