import type { HTMLAttributes } from "react";
import { AlertCircle, CircleCheckBig, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib";

type AlertTone = "success" | "warning" | "danger" | "info";

const iconMap = {
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info
} as const;

const classMap: Record<AlertTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info"
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title?: string;
}

export const Alert = ({
  className,
  tone = "info",
  title,
  children,
  ...props
}: AlertProps) => {
  const Icon = iconMap[tone];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-4 text-sm shadow-soft",
        classMap[tone],
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-current/90">{children}</div>
      </div>
    </div>
  );
};
