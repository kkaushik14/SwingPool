import type { ErrorInfo, PropsWithChildren, ReactNode } from "react";
import { Component } from "react";

import { RotateCcw } from "lucide-react";

import { Button, EmptyState } from "@/components";
import { getErrorMessage } from "@/utils";

interface AppErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Frontend crash boundary", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6">
        <div className="w-full space-y-4">
          <EmptyState
            eyebrow="Frontend recovery"
            title="The interface hit an unexpected edge."
            description={getErrorMessage(
              this.state.error,
              "A fresh reload should usually recover the shell without changing backend state."
            )}
            visual={
              <div className="rounded-3xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                The app kept the failure contained so we can recover cleanly.
              </div>
            }
          />
          <div className="flex justify-center">
            <Button variant="secondary" onClick={this.handleReset}>
              <RotateCcw className="h-4 w-4" />
              Reload app
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
