import React from "react";
import { UseQueryResult } from "@tanstack/react-query";

interface SkeletonLoaderProps {
  isLoading: boolean;
  isError: boolean;
  data: any;
  error: any;
  skeletonComponent: React.ComponentType<any>;
  errorComponent?: React.ComponentType<{ error: any; onRetry?: () => void }>;
  emptyComponent?: React.ComponentType;
  onRetry?: () => void;
  skeletonProps?: any;
}

export const useSkeletonLoader = ({
  isLoading,
  isError,
  data,
  error,
  skeletonComponent: SkeletonComponent,
  errorComponent: ErrorComponent,
  emptyComponent: EmptyComponent,
  onRetry,
  skeletonProps = {},
}: SkeletonLoaderProps): React.ReactElement | null => {
  if (isLoading) {
    return React.createElement(SkeletonComponent, { ...skeletonProps });
  }

  if (isError) {
    if (ErrorComponent) {
      return React.createElement(ErrorComponent, { error, onRetry });
    }
    
    // Default error component
    return React.createElement("div", { className: "p-12 text-center" }, [
      React.createElement("div", { 
        key: "error-icon",
        className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20" 
      }, 
        React.createElement("div", { className: "h-8 w-8 rounded-full bg-red-500" })
      ),
      React.createElement("p", { 
        key: "error-message",
        className: "mb-4 text-muted-foreground" 
      }, (error as Error)?.message ?? "Something went wrong. Please try again."),
      ...(onRetry ? [
        React.createElement("button", {
          key: "retry-button",
          onClick: onRetry,
          className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        }, "Try Again")
      ] : [])
    ]);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    if (EmptyComponent) {
      return React.createElement(EmptyComponent);
    }
    
    // Default empty component
    return React.createElement("div", { className: "p-12 text-center" }, [
      React.createElement("div", { 
        key: "empty-icon",
        className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted" 
      }, 
        React.createElement("div", { className: "h-8 w-8 rounded-full bg-muted-foreground/30" })
      ),
      React.createElement("p", { 
        key: "empty-message",
        className: "text-muted-foreground" 
      }, "No data available")
    ]);
  }

  return null; // Return null to render the actual content
};

// Hook for creating skeleton states based on content type
export const useSkeletonByType = (type: "card" | "list" | "grid" | "profile" | "video", items = 6): React.ReactElement => {
  const skeletonComponents = {
    card: () => React.createElement("div", { className: "space-y-4" },
      Array.from({ length: items }).map((_, i) =>
        React.createElement("div", { key: i, className: "p-4 border rounded-lg animate-pulse" }, [
          React.createElement("div", { key: "flex", className: "flex space-x-4" }, [
            React.createElement("div", { key: "icon", className: "h-12 w-12 bg-muted rounded-lg" }),
            React.createElement("div", { key: "content", className: "flex-1 space-y-2" }, [
              React.createElement("div", { key: "title", className: "h-4 bg-muted rounded w-3/4" }),
              React.createElement("div", { key: "subtitle", className: "h-3 bg-muted rounded w-1/2" })
            ])
          ])
        ])
      )
    ),
    list: () => React.createElement("div", { className: "space-y-3" },
      Array.from({ length: items }).map((_, i) =>
        React.createElement("div", { key: i, className: "flex items-center space-x-4 p-3 border rounded animate-pulse" }, [
          React.createElement("div", { key: "icon", className: "h-10 w-10 bg-muted rounded" }),
          React.createElement("div", { key: "content", className: "flex-1 space-y-1" }, [
            React.createElement("div", { key: "title", className: "h-4 bg-muted rounded w-3/4" }),
            React.createElement("div", { key: "subtitle", className: "h-3 bg-muted rounded w-1/3" })
          ]),
          React.createElement("div", { key: "action", className: "h-6 w-16 bg-muted rounded" })
        ])
      )
    ),
    grid: () => React.createElement("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3" },
      Array.from({ length: items }).map((_, i) =>
        React.createElement("div", { key: i, className: "border rounded-lg overflow-hidden animate-pulse" }, [
          React.createElement("div", { key: "image", className: "h-32 bg-muted" }),
          React.createElement("div", { key: "content", className: "p-4 space-y-2" }, [
            React.createElement("div", { key: "title", className: "h-5 bg-muted rounded w-3/4" }),
            React.createElement("div", { key: "desc1", className: "h-4 bg-muted rounded w-full" }),
            React.createElement("div", { key: "desc2", className: "h-4 bg-muted rounded w-2/3" })
          ])
        ])
      )
    ),
    profile: () => React.createElement("div", { className: "space-y-6 animate-pulse" }, [
      React.createElement("div", { key: "header", className: "flex items-center space-x-4" }, [
        React.createElement("div", { key: "avatar", className: "h-20 w-20 bg-muted rounded-full" }),
        React.createElement("div", { key: "info", className: "space-y-2" }, [
          React.createElement("div", { key: "name", className: "h-6 bg-muted rounded w-48" }),
          React.createElement("div", { key: "email", className: "h-4 bg-muted rounded w-32" })
        ])
      ]),
      React.createElement("div", { key: "details", className: "grid gap-4 md:grid-cols-2" },
        Array.from({ length: 4 }).map((_, i) =>
          React.createElement("div", { key: i, className: "p-4 border rounded space-y-2" }, [
            React.createElement("div", { key: "label", className: "h-3 bg-muted rounded w-1/4" }),
            React.createElement("div", { key: "value", className: "h-5 bg-muted rounded w-3/4" })
          ])
        )
      )
    ]),
    video: () => React.createElement("div", { className: "space-y-4 animate-pulse" }, [
      React.createElement("div", { key: "video", className: "h-96 bg-muted rounded-lg" }),
      React.createElement("div", { key: "info", className: "space-y-3" }, [
        React.createElement("div", { key: "title", className: "h-6 bg-muted rounded w-3/4" }),
        React.createElement("div", { key: "desc1", className: "h-4 bg-muted rounded w-full" }),
        React.createElement("div", { key: "desc2", className: "h-4 bg-muted rounded w-2/3" })
      ])
    ])
  };

  return (skeletonComponents[type] || skeletonComponents.card)();
};
