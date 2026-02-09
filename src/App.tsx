import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import OfflineBlocker from "@/components/OfflineBlocker";
import BehaviorTracker from "@/components/BehaviorTracker";
import Index from "./pages/Index";
// Import Batches page component
import Batches from "./pages/Batches";
import Study from "./pages/Study";
import WeeklySchedule from "./pages/WeeklySchedule";
import PdfBank from "./pages/PdfBank";
import MyBatches from "./pages/MyBatches";
import BatchDetails from "./pages/BatchDetails";
import TopicDetails from "./pages/TopicDetails";
import TopicSubjectDetails from "./pages/TopicSubjectDetails";
import NotFound from "./pages/NotFound";
import VideoDataNotFound from "./pages/VideoDataNotFound";
import Footer from "./components/Footer";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OtpVerification from "./pages/OtpVerification";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import VideoPlayer from "./pages/VideoPlayer";
import TicTacToe from "./pages/TicTacToe";
import DeveloperDocs from "./pages/DeveloperDocs";
// Import AiGuru component (FloatingAiGuru doesn't exist)
import AiGuru from "./pages/AiGuru";
import Notifications from "./pages/Notifications";
import { useBackButtonExit } from "./hooks/useBackButtonExit";
import OfflineBanner, { OfflineModal } from "./components/OfflineBanner";
import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProfileSkeleton, BatchCardSkeleton, TopicCardSkeleton, VideoPlayerSkeleton } from "./components/ui/skeleton-loaders";
import "@/config/firebase";

// Error interface for better type safety
interface AppError {
  message: string;
  stack?: string;
  status?: number;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: AppError) => {
        // Don't retry on 4xx/5xx errors
        if (error && typeof error === 'object' && error.status >= 400 && error.status < 600) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        // Error handling without console log
      },
    },
  },
});

// Loading fallback components
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-4">
        <div className="h-6 w-6 bg-primary-foreground rounded-full animate-spin border-2 border-transparent border-t-current" />
      </div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialAuthCheck, checkAuth } = useAuth();
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appError, setAppError] = useState<AppError | null>(null);

  // Show global loading during initial auth check to prevent login page flash
  if (isInitialAuthCheck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-4">
            <div className="h-6 w-6 bg-primary-foreground rounded-full animate-spin border-2 border-transparent border-t-current" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Hide footer on video player pages, login, OTP verification, AI Guru pages, and homepage
  const hideFooter = location.pathname.startsWith('/watch') || 
                    location.pathname.startsWith('/player') || 
                    location.pathname === '/login' || 
                    location.pathname === '/otp-verification' ||
                    location.pathname === '/ai-guru' ||
                    location.pathname === '/';

  // Global error handler
  const handleGlobalError = React.useCallback((error: Error, errorInfo: any) => {
    setAppError({
      message: error.message,
      stack: error.stack,
      status: (error as any).status
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, check authentication
      if (isAuthenticated) {
        checkAuth();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, checkAuth]);

  const handleRetryConnection = async () => {
    try {
      // Try to make a simple request to check connectivity
      const response = await fetch('https://api.penpencil.co/v3/users?landingPage=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'randomid': crypto.randomUUID(),
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok || response.status === 401) {
        // Connection is working (401 is expected without auth)
        setIsOnline(true);
        await checkAuth();
      }
      } catch (error) {
        setIsOnline(false);
    }
  };

  const handleAccessGames = () => {
    setShowOfflineModal(false);
    navigate('/tictactoe');
  };

  const handleRetry = () => {
    setAppError(null);
    window.location.reload();
  };

  // If there's a global error, show error boundary
  if (appError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Application Error</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineBanner 
        onRetry={handleRetryConnection}
        showGamesAccess={isAuthenticated}
        onAccessGames={handleAccessGames}
      />
      
      {isAuthenticated && (
        <BehaviorTracker 
          userId={isAuthenticated ? JSON.parse(localStorage.getItem('user_data') || '{}').id : ''}
          trackPageViews={true}
          trackInteractions={true}
          customData={{
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }}
        >
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Index />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/batches" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Batches />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/study" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Study />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/weekly-schedule" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <WeeklySchedule />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/pdf-bank" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <PdfBank />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Community />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/ai-guru" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <AiGuru />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Notifications />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/my-batches" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<ProfileSkeleton />}>
                    <MyBatches />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/batch/:batchId" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<BatchCardSkeleton />}>
                    <BatchDetails />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/batch/:batchId/subject/:subjectSlug/topics" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<TopicCardSkeleton />}>
                    <TopicDetails />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/batch/:batchId/subject/:subjectSlug/topic/:topicId" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<VideoPlayerSkeleton />}>
                    <TopicSubjectDetails />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/topic/:topicId" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<TopicCardSkeleton />}>
                    <TopicDetails />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/video-data-not-found" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <VideoDataNotFound />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/watch" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<VideoPlayerSkeleton />}>
                    <VideoPlayer />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/tictactoe" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <TicTacToe />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Suspense fallback={<ProfileSkeleton />}>
                    <Profile />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BehaviorTracker>
      )}
      
      {!isAuthenticated && !isInitialAuthCheck && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="*" element={<Login />} />
        </Routes>
      )}
      
      <OfflineModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        onRetry={handleRetryConnection}
        showGamesAccess={isAuthenticated}
        onAccessGames={handleAccessGames}
      />
      
      {!hideFooter && <Footer />}
      
      <Analytics />
    </>
  );
};

const App = () => {
  // Enable double back button exit functionality
  useBackButtonExit();

  // Global error handler
  const handleGlobalError = React.useCallback((error: Error, errorInfo: any) => {
    // Error handling without console log
  }, []);

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <OfflineBlocker>
                <AppContent />
              </OfflineBlocker>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
