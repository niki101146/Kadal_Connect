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
  if (!res.ok) {
    const msg = data?.detail || (data && Object.values(data).flat().join(" ")) || "Something went wrong.";
    throw new Error(msg);
  }
  return data;
}
export const list = (d) => (Array.isArray(d) ? d : d?.results ?? []);
