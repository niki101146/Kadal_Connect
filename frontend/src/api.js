const KEY = "kadal_token";
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

// In production set VITE_API_URL=https://YOUR-BACKEND.onrender.com/api ; locally the Vite proxy handles "/api"
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const TIMEOUT_MS = 45000; // a sleeping Render server can need ~30-60 s to wake up
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fetch with a timeout; GET requests are retried once on a timeout, network error or 502/503/504 (server waking up)
async function request(url, opts, retries) {
  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      if (attempt < retries && [502, 503, 504].includes(res.status)) {
        const peek = await res.clone().json().catch(() => null);
        if (!peek?.sources) { await sleep(1500); continue; } // weather 502 with "sources" is handled by the fallback below
      }
      return res;
    } catch (e) {
      if (attempt < retries) { await sleep(1500); continue; }
      throw new Error(e.name === "AbortError" ? "The server is taking too long to respond. It may be waking up, please try again." : "Cannot reach the server. Check your internet connection.");
    } finally { clearTimeout(timer); }
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await request(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }, method === "GET" ? 1 : 0);
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