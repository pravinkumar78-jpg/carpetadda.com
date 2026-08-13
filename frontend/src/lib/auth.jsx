import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("eh_token");
    if (!token) { setReady(true); return; }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("eh_token"))
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("eh_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("eh_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem("eh_token");
    setUser(null);
  };
  const refresh = async () => {
    try { const { data } = await api.get("/auth/me"); setUser(data); } catch { /* keep current */ }
  };

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
