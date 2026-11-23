import { useCallback, useEffect, useRef, useState } from "react";
import { api, list } from "./api.js";

export function useApi(path, { skip = false, asList = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: "", path });
  const seq = useRef(0);
  const load = useCallback(() => {
    if (skip || !path) return;
    const mine = ++seq.current; // a slower, older request must never overwrite a newer one
    // keep the data while refreshing the same URL, but never show another harbor's data under a new one
    setState((s) => ({ data: s.path === path ? s.data : null, loading: true, error: "", path }));
    api(path)
      .then((d) => mine === seq.current && setState({ data: asList ? list(d) : d, loading: false, error: "", path }))
      .catch((e) => mine === seq.current && setState({ data: null, loading: false, error: e.message, path }));
  }, [path, skip, asList]);
  useEffect(() => { load(); }, [load]);
  return { data: state.data, loading: state.loading, error: state.error, reload: load };
}

// small localStorage-backed state (saved catch, view preferences)
export function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}
