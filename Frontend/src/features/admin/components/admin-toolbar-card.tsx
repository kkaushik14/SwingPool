import type { ReactNode } from "react";

import { Card } from "@/components";

export const AdminToolbarCard = ({
  children,
  actions
}: {
  children: ReactNode;
  actions?: ReactNode;
}) => (
  <Card className="space-y-4 bg-surface-elevated/95">
    <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      {actions ? <div className="flex flex-wrap gap-3 xl:justify-end">{actions}</div> : null}
    </div>
  </Card>
);
