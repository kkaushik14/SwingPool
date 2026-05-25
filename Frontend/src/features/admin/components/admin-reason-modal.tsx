import type { ReactNode } from "react";

import {
  Button,
  Field,
  Input,
  Modal,
  Spinner,
  Textarea
} from "@/components";

export const AdminReasonModal = ({
  open,
  title,
  description,
  reason,
  reasonLabel = "Reason",
  reasonPlaceholder = "Document why this action is necessary.",
  confirmLabel,
  isPending = false,
  onReasonChange,
  onClose,
  onConfirm,
  children
}: {
  open: boolean;
  title: string;
  description: string;
  reason: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel: string;
  isPending?: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) => (
  <Modal
    description={description}
    footer={
      <div className="flex flex-wrap gap-3">
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button
          disabled={isPending || reason.trim().length < 5}
          onClick={onConfirm}
          variant="accent"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? "Saving..." : confirmLabel}
        </Button>
      </div>
    }
    onClose={onClose}
    open={open}
    title={title}
    size="lg"
  >
    <div className="space-y-5">
      {children}
      <Field htmlFor="admin-reason" label={reasonLabel} hint="Sensitive actions should always include an audit-friendly reason.">
        <Textarea
          id="admin-reason"
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder={reasonPlaceholder}
          value={reason}
        />
      </Field>
    </div>
  </Modal>
);

export const AdminInlineField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <Field htmlFor={id} label={label}>
    <Input
      id={id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  </Field>
);
