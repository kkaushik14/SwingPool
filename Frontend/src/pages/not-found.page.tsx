import { Link } from "react-router-dom";

import { Button, EmptyState } from "@/components";

export const NotFoundPage = () => {
  return (
    <div className="py-12">
      <EmptyState
        eyebrow="404"
        title="This page drifted out of the route map."
        description="The frontend shell is ready, but this URL does not map to a current page. Head back to the main workspace or public overview."
        visual={<div className="font-display text-6xl text-accent">404</div>}
        actionLabel="Return home"
        onAction={() => {
          window.location.href = "/";
        }}
      />
      <div className="mt-6 flex justify-center">
        <Link
          to="/app"
          className="inline-flex h-11 items-center justify-center rounded-pill bg-surface-elevated px-5 text-sm font-semibold text-foreground shadow-soft ring-1 ring-border transition-colors hover:bg-surface-soft"
        >
          Go to workspace
        </Link>
      </div>
    </div>
  );
};
