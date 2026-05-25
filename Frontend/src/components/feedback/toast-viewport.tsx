import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CircleCheckBig,
  Info,
  TriangleAlert,
  X
} from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib";
import { dismissToast, useToastStore, type ToastTone } from "@/store";

const toneStyles: Record<ToastTone, string> = {
  success: "border-success/30 bg-surface-elevated text-foreground",
  warning: "border-warning/30 bg-surface-elevated text-foreground",
  danger: "border-danger/30 bg-surface-elevated text-foreground",
  info: "border-info/30 bg-surface-elevated text-foreground"
};

const toneIcons = {
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info
} satisfies Record<ToastTone, typeof Info>;

export const ToastViewport = () => {
  const toasts = useToastStore();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismissToast(toast.id);
      }, toast.durationMs ?? 4500)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-end p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = toneIcons[toast.tone];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "pointer-events-auto rounded-2xl border px-4 py-4 shadow-card backdrop-blur",
                  toneStyles[toast.tone]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-surface-soft p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {toast.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    aria-label="Dismiss toast"
                    className="h-9 w-9 shrink-0"
                    size="icon"
                    variant="ghost"
                    onClick={() => dismissToast(toast.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
