
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the logged-in user after refreshing the page
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const token = response.data.access_token;

    if (!token) {
      throw new Error("Access token was not returned by the login API.");
    }

    localStorage.setItem("access_token", token);

    try {
      const userResponse = await api.get("/auth/me");
      setUser(userResponse.data);
      localStorage.setItem("user", JSON.stringify(userResponse.data));
      return userResponse.data;
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setUser(null);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
