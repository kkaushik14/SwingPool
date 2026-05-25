import { describe, expect, it } from "vitest";

import { getPostAuthRedirect, getReturnToPath, sanitizeRedirectTarget } from "@/routes/access";
import { routePaths } from "@/routes/paths";

describe("route access helpers", () => {
  it("builds return urls with search and hash", () => {
    expect(
      getReturnToPath({
        pathname: "/admin/users",
        search: "?page=2",
        hash: "#review"
      })
    ).toBe("/admin/users?page=2#review");
  });

  it("keeps allowed admin redirects internal", () => {
    expect(sanitizeRedirectTarget("/admin/audit", "admin")).toBe("/admin/audit");
  });

  it("forces standard users away from admin-only routes", () => {
    expect(sanitizeRedirectTarget("/admin/audit", "user")).toBe(routePaths.app);
  });

  it("forces admins away from member-only routes", () => {
    expect(sanitizeRedirectTarget("/app/subscriptions", "admin")).toBe(routePaths.admin);
  });

  it("rejects unsafe external redirects", () => {
    expect(sanitizeRedirectTarget("https://malicious.example", "user")).toBe(routePaths.app);
    expect(sanitizeRedirectTarget("//malicious.example", "admin")).toBe(routePaths.admin);
  });

  it("falls back to the role home path when no redirect is supplied", () => {
    expect(getPostAuthRedirect("user")).toBe(routePaths.app);
    expect(getPostAuthRedirect("admin")).toBe(routePaths.admin);
  });

  it("never redirects authenticated users back to auth-only pages", () => {
    expect(sanitizeRedirectTarget(routePaths.login, "user")).toBe(routePaths.app);
    expect(sanitizeRedirectTarget(routePaths.signup, "admin")).toBe(routePaths.admin);
  });
});
