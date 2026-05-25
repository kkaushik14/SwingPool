import type { PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { ToastViewport } from "@/components";
import { AuthProvider } from "@/features/auth";
import { queryClient } from "@/lib";
import { ThemeProvider } from "@/theme";

import { AppErrorBoundary } from "./app-error-boundary";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </AppErrorBoundary>
        <ToastViewport />
      </QueryClientProvider>
    </ThemeProvider>
  );
};
