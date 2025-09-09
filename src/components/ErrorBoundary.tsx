import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AppError, ErrorBoundaryProps, ErrorBoundaryState } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isDevelopment } from '@/lib/env';

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = error instanceof AppError ? error : new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false,
      { originalError: error.message }
    );

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const appError = error instanceof AppError ? error : new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false,
      { originalError: error.message }
    );

    logger.error('Error boundary caught an error', appError, {
      componentStack: errorInfo.componentStack,
    });

    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      const error = this.state.error!;

      if (FallbackComponent) {
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: AppError;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, resetError }) => {
  const isDev = isDevelopment();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && (
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <div className="font-medium text-gray-900">Error Details (Development)</div>
              <div className="mt-1 text-gray-700">
                <div><strong>Code:</strong> {error.code}</div>
                <div><strong>Status:</strong> {error.statusCode}</div>
                <div><strong>Message:</strong> {error.message}</div>
                {error.context && (
                  <div className="mt-2">
                    <strong>Context:</strong>
                    <pre className="mt-1 text-xs overflow-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            If the problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: AppError; resetError: () => void }>,
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void
): React.ComponentType<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const handleError = React.useCallback((error: unknown, context?: Record<string, unknown>) => {
    const appError = error instanceof AppError ? error : new AppError(
      error instanceof Error ? error.message : String(error),
      'UNKNOWN_ERROR',
      500,
      false,
      context
    );

    logger.error('Error handled by useErrorHandler', appError, context);
    return appError;
  }, []);

  return { handleError };
}
