import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib";

export const Spinner = ({
  className,
  "aria-label": ariaLabel = "Loading"
}: {
  className?: string;
  "aria-label"?: string;
}) => (
  <LoaderCircle
    aria-label={ariaLabel}
    className={cn("h-4 w-4 animate-spin text-current", className)}
  />
);
