import { useSyncExternalStore } from "react";

export type ToastTone = "success" | "warning" | "danger" | "info";

export interface ToastRecord {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

type ToastListener = () => void;

const listeners = new Set<ToastListener>();
let toastState: ToastRecord[] = [];

const emit = () => {
  listeners.forEach((listener) => listener());
};

const createToastId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.round(Math.random() * 10000)}`;
};

export const subscribeToasts = (listener: ToastListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getToastSnapshot = () => toastState;

export const pushToast = ({
  id = createToastId(),
  durationMs = 4500,
  ...toast
}: Omit<ToastRecord, "id"> & { id?: string }) => {
  toastState = [...toastState, { id, durationMs, ...toast }];
  emit();
  return id;
};

export const dismissToast = (id: string) => {
  toastState = toastState.filter((toast) => toast.id !== id);
  emit();
};

export const clearToasts = () => {
  toastState = [];
  emit();
};

export const useToastStore = () =>
  useSyncExternalStore(subscribeToasts, getToastSnapshot, getToastSnapshot);
