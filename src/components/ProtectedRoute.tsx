import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isTokenValid, logout } from "@/lib/auth.js";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            
            // Simple localStorage-based authentication check
            if (isTokenValid()) {
                setIsAuthenticated(true);
            } else {
                // Token is expired or invalid, logout
                logout();
                setIsAuthenticated(false);
                
                // Only show toast if we're actually redirecting from a protected page
                if (location.pathname !== "/login" && location.pathname !== "/otp-verification") {
                    toast.error("Session expired. Please login again.");
                }
            }
            
            setIsLoading(false);
        };

        checkAuth();
    }, [location]);

    // Show loading spinner only during initial check
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">Checking session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
