import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib";

export const Table = ({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) => (
  <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
    <div className="overflow-x-auto">
      <table className={cn("min-w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  </div>
);

export const TableHead = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-surface-soft", className)} {...props} />
);

export const TableBody = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-border/70", className)} {...props} />
);

export const TableRow = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("transition-colors hover:bg-surface-soft/70", className)} {...props} />
);

export const TableHeaderCell = ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground", className)}
    {...props}
  />
);

export const TableCell = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3 text-foreground", className)} {...props} />
);
