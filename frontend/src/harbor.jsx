import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const Ctx = createContext(null);
export const useHarbor = () => useContext(Ctx);

export function HarborProvider({ children }) {
  const [harbors, setHarbors] = useState([]);
  const [id, setId] = useState(localStorage.getItem("kadal_harbor") || "");
  useEffect(() => {
    api("/auth/harbors/").then((h) => {
      setHarbors(h);
      setId((cur) => (h.some((x) => String(x.id) === String(cur)) ? cur : h[0]?.id ?? ""));
    }).catch(() => {});
  }, []);
  useEffect(() => { if (id) localStorage.setItem("kadal_harbor", id); }, [id]);
  const harbor = harbors.find((h) => String(h.id) === String(id));
  return <Ctx.Provider value={{ harbors, harbor, id, setId }}>{children}</Ctx.Provider>;
}
