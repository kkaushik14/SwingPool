import { AnimatePresence, motion } from "framer-motion";
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useId,
  useRef
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib";

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export const Modal = ({
  open,
  title,
  description,
  onClose,
  footer,
  size = "md",
  children
}: ModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocusedElement =
      typeof document.activeElement === "object" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className={cn(
              "w-full rounded-2xl border border-border bg-surface-elevated p-6 shadow-card",
              size === "lg" ? "max-w-3xl" : "max-w-xl"
            )}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 id={titleId} className="font-display text-2xl text-foreground">
                  {title}
                </h3>
                {description ? (
                  <p id={descriptionId} className="text-sm text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="rounded-pill border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-surface-soft hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 flex justify-end">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};
