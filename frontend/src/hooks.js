import { useCallback, useEffect, useState } from "react";
import { api, list } from "./api.js";

export function useApi(path, { skip = false, asList = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: "" });
  const load = useCallback(() => {
    if (skip || !path) return;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path)
      .then((d) => setState({ data: asList ? list(d) : d, loading: false, error: "" }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [path, skip, asList]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

// small localStorage-backed state (saved catch, view preferences)
export function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}
