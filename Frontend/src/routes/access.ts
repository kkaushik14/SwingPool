import { routePaths } from "./paths";

import type { UserRecord } from "@/types";

type AppRole = UserRecord["role"];

const isInternalPath = (value: string) => value.startsWith("/") && !value.startsWith("//");

export const getRoleHomePath = (role: AppRole) =>
  role === "admin" ? routePaths.admin : routePaths.app;

export const getReturnToPath = ({
  pathname,
  search,
  hash
}: {
  pathname: string;
  search?: string;
  hash?: string;
}) => `${pathname}${search || ""}${hash || ""}`;

export const sanitizeRedirectTarget = (candidate: unknown, role?: AppRole) => {
  const fallback = role ? getRoleHomePath(role) : routePaths.home;

  if (typeof candidate !== "string" || !isInternalPath(candidate)) {
    return fallback;
  }

  if (
    candidate === routePaths.login ||
    candidate === routePaths.register ||
    candidate === routePaths.signup
  ) {
    return fallback;
  }

  if (role === "admin") {
    return candidate.startsWith(routePaths.app) ? routePaths.admin : candidate;
  }

  if (candidate.startsWith(routePaths.admin)) {
    return routePaths.app;
  }

  return candidate;
};

export const getPostAuthRedirect = (role: AppRole, candidate?: unknown) =>
  sanitizeRedirectTarget(candidate, role);

export const isAdminRole = (role?: AppRole | null) => role === "admin";
