import { Skeleton } from "@/components/ui";
import { cn } from "@/lib";

export const AppLoadingScreen = ({
  title = "Preparing your workspace",
  description = "We’re validating your session, loading routes, and syncing the latest backend state.",
  fullScreen = false
}: {
  title?: string;
  description?: string;
  fullScreen?: boolean;
}) => {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6",
        fullScreen && "min-h-screen justify-center"
      )}
    >
      <div className="rounded-3xl border border-border/70 bg-surface/90 p-6 shadow-card backdrop-blur-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Loading
          </p>
          <h1 className="mt-3 font-display text-3xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-surface-soft/80 p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-5/6" />
            <Skeleton className="h-12 w-4/5" />
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-surface-elevated/80 p-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
};
