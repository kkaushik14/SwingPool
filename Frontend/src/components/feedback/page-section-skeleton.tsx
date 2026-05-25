import { Card, Skeleton } from "@/components/ui";

export const PageSectionSkeleton = ({
  cards = 3,
  rows = 4
}: {
  cards?: number;
  rows?: number;
}) => (
  <div className="space-y-6">
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={`skeleton-card-${index}`} className="space-y-4 bg-surface-elevated/95">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      ))}
    </div>
    <Card className="space-y-4 bg-surface-elevated/95">
      <Skeleton className="h-5 w-36" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`skeleton-row-${index}`} className="grid gap-3 md:grid-cols-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </Card>
  </div>
);
