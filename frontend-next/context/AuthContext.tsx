"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "individual" | "institutional";
}

interface AuthContextType {
  authLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  authModalOpen: boolean;
  authMode: "signin" | "signup";
  openAuth: (mode?: "signin" | "signup") => void;
  closeAuth: () => void;
  login: (email?: string, name?: string, role?: "individual" | "institutional") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "nexquant_auth_state_v2";
const USER_STORAGE_KEY = "nexquant_user_profile_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Synchronize auth state on mount and across browser tabs
  useEffect(() => {
    function loadAuthState() {
      try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY) === "true" || localStorage.getItem("nexquant-auth") === "true";
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (storedAuth) {
          setIsAuthenticated(true);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser({
              id: "user_quant_01",
              name: "Institutional Trader",
              email: "trader@nexquant.internal",
              role: "institutional"
            });
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuthState();

    function handleStorageChange(e: StorageEvent) {
      if (e.key === AUTH_STORAGE_KEY || e.key === "nexquant-auth" || e.key === USER_STORAGE_KEY) {
        loadAuthState();
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const openAuth = useCallback((mode: "signin" | "signup" = "signin") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const login = useCallback((email?: string, name?: string, role: "individual" | "institutional" = "institutional") => {
    const profile: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      name: name || (email ? email.split("@")[0] : "Quantitative Analyst"),
      email: email || "analyst@nexquant.internal",
      role
    };
    
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem("nexquant-auth", "true");
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Storage fallback
    }

    setUser(profile);
    setIsAuthenticated(true);
    setAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("nexquant-auth");
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Storage fallback
    }

    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        isAuthenticated,
        user,
        authModalOpen,
        authMode,
        openAuth,
        closeAuth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
