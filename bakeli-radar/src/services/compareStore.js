import { useSyncExternalStore } from 'react';

// Sélection de formations à comparer (3 maximum), conservée dans le navigateur.
const STORAGE_KEY = 'annuaire_compare';
export const MAX_COMPARE = 3;

const listeners = new Set();

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value.filter((id) => typeof id === 'string' && id).slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
};

let snapshot = read();

const write = (ids) => {
  snapshot = ids;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // stockage indisponible : la sélection reste valable pour cette session
  }
  listeners.forEach((listener) => listener());
};

export const compareStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => snapshot,
  toggle(id) {
    const key = String(id);
    if (snapshot.includes(key)) {
      write(snapshot.filter((item) => item !== key));
      return true;
    }
    if (snapshot.length >= MAX_COMPARE) return false;
    write([...snapshot, key]);
    return true;
  },
  remove(id) {
    write(snapshot.filter((item) => item !== String(id)));
  },
  clear() {
    write([]);
  },
};

export const useCompareList = () => {
  const ids = useSyncExternalStore(compareStore.subscribe, compareStore.getSnapshot);
  return {
    ids,
    isFull: ids.length >= MAX_COMPARE,
    has: (id) => ids.includes(String(id)),
    toggle: compareStore.toggle,
    remove: compareStore.remove,
    clear: compareStore.clear,
  };
};
