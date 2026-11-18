import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());
  useEffect(() => {
    if (getToken()) api("/auth/me/").then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  async function login(username, password) {
    const t = await api("/auth/token/", { method: "POST", body: { username, password } });
    setToken(t.access);
    const me = await api("/auth/me/");
    setUser(me);
    return me;
  }
  async function updateProfile(body) {
    const me = await api("/auth/me/", { method: "PATCH", body });
    setUser(me);
    return me;
  }
  const logout = () => { setToken(null); setUser(null); };
  return <Ctx.Provider value={{ user, ready, login, logout, updateProfile }}>{children}</Ctx.Provider>;
}
