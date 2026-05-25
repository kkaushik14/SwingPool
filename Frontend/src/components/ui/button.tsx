import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Link, type LinkProps } from "react-router-dom";

import { cn } from "@/lib";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-pill text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-card hover:-translate-y-0.5 hover:bg-primary/90",
        secondary:
          "bg-surface-elevated text-foreground shadow-soft ring-1 ring-border hover:bg-surface-soft",
        ghost: "text-foreground hover:bg-surface-soft",
        accent:
          "bg-accent text-accent-foreground shadow-glow hover:-translate-y-0.5 hover:bg-accent/90",
        coral:
          "bg-coral text-coral-foreground shadow-soft hover:-translate-y-0.5 hover:bg-coral/90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-soft"
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export interface ButtonLinkProps
  extends Omit<LinkProps, "className">,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

ButtonLink.displayName = "ButtonLink";
