import { createContext, useContext, useState } from "react";
import { api, setToken, clearToken, getToken } from "../services/api";

export const AuthContext = createContext(null);

const USER_KEY = "ancps_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved && getToken() ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      setToken(data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async ({ name, email, password }) => {
    try {
      await api.register({ name, email, password });
      return await login(email, password);
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, register, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}