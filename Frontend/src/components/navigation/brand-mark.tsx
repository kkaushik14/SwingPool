import { cn } from "@/lib";

export const BrandMark = ({ className }: { className?: string }) => {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-mesh-warm shadow-glow">
        <div className="absolute inset-1 rounded-[1rem] border border-white/20 bg-primary/90" />
        <span className="relative font-display text-lg text-primary-foreground">SP</span>
      </div>
      <div>
        <p className="font-display text-xl text-foreground">Swing Pool</p>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Warm Premium Play</p>
      </div>
    </div>
  );
};
