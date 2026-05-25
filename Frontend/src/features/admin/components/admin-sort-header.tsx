import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components";

export const AdminSortHeader = ({
  label,
  field,
  sortBy,
  sortOrder,
  onSort
}: {
  label: string;
  field: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort: (field: string) => void;
}) => {
  const isCurrent = sortBy === field;
  const Icon = !isCurrent ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <Button
      className="h-auto px-0 py-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      onClick={() => onSort(field)}
      variant="ghost"
      size="sm"
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
};
