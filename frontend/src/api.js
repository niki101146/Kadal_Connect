const KEY = "kadal_token";
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

// In production set VITE_API_URL=https://YOUR-BACKEND.onrender.com/api ; locally the Vite proxy handles "/api"
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  // Open-Meteo rate-limits the server (HTTP 429), so fetch the forecast from the visitor's own connection instead
  if (res.status === 502 && data?.sources && path.startsWith("/weather/")) {
    try {
      const [sea, air] = await Promise.all([fetch(data.sources.marine).then((r) => r.json()), fetch(data.sources.air).then((r) => r.json())]);
      const q = path.includes("?") ? path.slice(path.indexOf("?")) : "";
      const r2 = await fetch(`${BASE}/weather/compute/${q}`, { method: "POST", headers, body: JSON.stringify({ sea, air }) });
      const d2 = await r2.json().catch(() => null);
      if (r2.ok) return d2;
    } catch { /* fall through to the normal error below */ }
  }
  if (!res.ok) {
    const msg = data?.detail || (data && Object.values(data).flat().join(" ")) || "Something went wrong.";
    throw new Error(msg);
  }
  return data;
}
export const list = (d) => (Array.isArray(d) ? d : d?.results ?? []);