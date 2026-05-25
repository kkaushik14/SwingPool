import { Button } from "@/components";
import type { ApiMeta } from "@/types";

export const AdminPaginationControls = ({
  meta,
  onPrevious,
  onNext
}: {
  meta?: ApiMeta | null;
  onPrevious: () => void;
  onNext: () => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-3 shadow-soft">
    <p className="text-sm text-muted-foreground">
      Page {meta?.page || 1}
      {meta?.totalPages ? ` of ${meta.totalPages}` : ""} • {meta?.totalItems || 0} total rows
    </p>
    <div className="flex gap-3">
      <Button
        disabled={!meta?.hasPreviousPage}
        onClick={onPrevious}
        variant="secondary"
        size="sm"
      >
        Previous
      </Button>
      <Button
        disabled={!meta?.hasNextPage}
        onClick={onNext}
        variant="secondary"
        size="sm"
      >
        Next
      </Button>
    </div>
  </div>
);
