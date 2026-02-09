import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import "@/config/firebase";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

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
        // Only show toast if we're actually redirecting from a protected page
        // and not from login/otp pages to avoid confusing messages
        const fromProtectedPage = !["/login", "/otp-verification"].includes(location.pathname);
        
        if (fromProtectedPage) {
            toast.error("Session expired. Please login again.");
        }
        
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
