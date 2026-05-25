import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib";

export const Reveal = ({
  className,
  children
}: PropsWithChildren<{ className?: string }>) => {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};
