import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary, useErrorHandler } from "@/components/ErrorBoundary";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import Index from "./pages/Index";
import CreateWallet from "./pages/CreateWallet";
import Dashboard from "./pages/Dashboard";
import Documentation from "./pages/Documentation";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Configure QueryClient with optimized caching and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
      refetchOnMount: true, // Only refetch on mount if data is stale
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      onError: (error: unknown) => {
        logger.error('Mutation error', error as Error);
      },
      retry: 1, // Retry mutations once on failure
    },
  },
});

const App = () => {
  const { handleError } = useErrorHandler();

  const onError = (error: AppError, errorInfo: React.ErrorInfo) => {
    handleError(error, { errorInfo });
  };

  return (
    <ErrorBoundary onError={onError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/create-wallet" element={<CreateWallet />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
