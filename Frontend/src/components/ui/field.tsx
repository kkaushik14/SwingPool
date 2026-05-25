import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode
} from "react";

import { cn } from "@/lib";

import { Label } from "./label";

export const FieldHint = ({
  id,
  className,
  children
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) => (
  <p id={id} className={cn("mt-2 text-sm text-muted-foreground", className)}>
    {children}
  </p>
);

export const FieldError = ({
  id,
  className,
  children
}: {
  id: string;
  className?: string;
  children?: ReactNode;
}) =>
  children ? (
    <p id={id} role="alert" className={cn("mt-2 text-sm text-danger", className)}>
      {children}
    </p>
  ) : null;

export const Field = ({
  htmlFor,
  label,
  hint,
  error,
  required,
  className,
  children
}: {
  htmlFor: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) => {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const content = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      "aria-describedby": describedBy,
      "aria-invalid": error ? true : undefined
    });
  });

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </Label>
      {content}
      {hint ? <FieldHint id={hintId!}>{hint}</FieldHint> : null}
      <FieldError id={errorId!}>{error}</FieldError>
    </div>
  );
};
