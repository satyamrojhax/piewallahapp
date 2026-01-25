import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isTokenValid, logout, getStoredUserData } from "@/lib/auth.js";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  checkAuth: () => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const checkAuth = async () => {
    try {
      // Simple localStorage-based authentication check
      if (isTokenValid()) {
        const userData = getStoredUserData();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        // Token is expired or invalid, logout
        logout();
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    // Check authentication on mount only
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    checkAuth,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
