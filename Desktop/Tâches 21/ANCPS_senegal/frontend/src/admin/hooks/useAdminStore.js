import { useState, useCallback } from "react";
import { loadStore, saveStore } from "../services/adminStore";


export function useAdminStore() {
  const [store, setStore] = useState(() => loadStore() || {});

  const refresh = useCallback(() => {
    setStore(loadStore() || {});
  }, []);

  const update = useCallback((next) => {
    saveStore(next);
    setStore(next);
  }, []);

  return { store, setStore, refresh, update };
}
