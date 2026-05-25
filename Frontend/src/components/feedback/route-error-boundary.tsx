import { RotateCcw } from "lucide-react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

import { Button, EmptyState } from "@/components/ui";
import { routePaths } from "@/routes/paths";
import { ApiRequestError } from "@/types";
import { getErrorMessage } from "@/utils";

const getErrorContext = (error: unknown) => {
  if (error instanceof ApiRequestError) {
    return {
      title: "The app couldn’t finish this request.",
      description: `${error.message}${error.requestId ? ` Request ID: ${error.requestId}.` : ""}`
    };
  }

  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      description:
        typeof error.data === "string"
          ? error.data
          : "The route loaded into an unexpected state. A refresh should usually recover it."
    };
  }

  return {
    title: "Something unexpected interrupted this view.",
    description: getErrorMessage(
      error,
      "A refresh should usually recover the app. If it keeps happening, capture the failing route and backend request id."
    )
  };
};

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  const details = getErrorContext(error);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6">
      <EmptyState
        eyebrow="Route error"
        title={details.title}
        description={details.description}
        visual={
          <div className="rounded-3xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            The route shell stayed intact, but the current view could not complete safely.
          </div>
        }
      />
      <div className="sr-only" />
      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" />
          Reload
        </Button>
        <Link
          to={routePaths.home}
          className="inline-flex h-11 items-center justify-center rounded-pill border border-border bg-surface px-5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-surface-soft"
        >
          Return home
        </Link>
      </div>
    </div>
  );
};
