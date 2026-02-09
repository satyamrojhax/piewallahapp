import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isTokenValid, logout, getStoredUserData, handleAuthError } from "@/lib/auth.js";
import "@/config/firebase";

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
      // Check if token is valid
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

  // Enhanced token validation that redirects to login
  const validateTokenAndRedirect = () => {
    if (!isTokenValid()) {
      logout();
      return false;
    }
    return true;
  };

  const logoutUser = () => {
    handleAuthError();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Only check auth on initial mount, not on every render
  useEffect(() => {
    // Check authentication on mount only
    checkAuth();
  }, []);

  // Handle online/offline events - preserve tokens in localStorage
  useEffect(() => {
    const handleOffline = () => {
      // User is offline - app will be blocked, but tokens remain in localStorage
      // Don't logout - just log the state
    };

    const handleOnline = () => {
      // User is back online - checking token validity
      // When user comes back online, check if token is still valid
      if (isAuthenticated && !isTokenValid()) {
        // Token expired while offline, logging out
        logoutUser();
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated]);

  // Minimal periodic token validation (every 10 minutes) for security - only when online
  useEffect(() => {
    const interval = setInterval(() => {
      // Only check if user is online to avoid unnecessary checks
      if (navigator.onLine && isAuthenticated && !isTokenValid()) {
        // Token expired during periodic check, logging out
        logoutUser();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    checkAuth,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
