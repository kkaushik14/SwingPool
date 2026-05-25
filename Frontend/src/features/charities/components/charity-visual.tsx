import { HeartHandshake } from "lucide-react";

import { Badge } from "@/components";
import { cn } from "@/lib";

export const CharityVisual = ({
  label,
  category,
  className
}: {
  label: string;
  category: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 p-5 text-white shadow-card",
        "min-h-[180px]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%)]" />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="accent">{category}</Badge>
          <div className="rounded-full border border-white/20 bg-white/10 p-3 text-white">
            <HeartHandshake className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
            Charity spotlight
          </p>
          <p className="max-w-[14rem] font-display text-3xl leading-tight">{label}</p>
        </div>
      </div>
    </div>
  );
};
