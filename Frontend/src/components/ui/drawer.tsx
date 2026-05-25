import { AnimatePresence, motion } from "framer-motion";
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useId,
  useRef
} from "react";
import { createPortal } from "react-dom";

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
}

export const Drawer = ({ open, title, onClose, footer, children }: DrawerProps) => {
  const titleId = useId();
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
          className="fixed inset-0 z-50 flex bg-foreground/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            aria-labelledby={titleId}
            aria-modal="true"
            className="ml-auto flex h-full w-full max-w-sm flex-col border-l border-border bg-surface-elevated p-5 shadow-card"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id={titleId} className="font-display text-xl text-foreground">
                {title}
              </h3>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="rounded-pill border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-surface-soft hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer ? <div className="mt-4">{footer}</div> : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};
