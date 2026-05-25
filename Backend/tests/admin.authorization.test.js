import { describe, expect, it, vi } from "vitest";

import { adminRepository } from "../src/components/admin/admin.repository.js";
import { adminService } from "../src/components/admin/admin.service.js";
import { USER_ROLES } from "../src/enums/index.js";
import { authorizeRoles } from "../src/middlewares/index.js";

const adminContext = {
  actorId: "507f1f77bcf86cd799439012",
  role: "admin",
  requestId: "req-admin-1",
};

describe("Admin Authorization", () => {
  it("denies non-admin role through role middleware", () => {
    const middleware = authorizeRoles(USER_ROLES.ADMIN);
    const req = {
      auth: {
        role: USER_ROLES.USER,
      },
    };

    let nextError;

    middleware(req, {}, (error) => {
      nextError = error;
    });

    expect(nextError).toBeTruthy();
    expect(nextError.message).toContain("not authorized");
  });

  it("allows admin role through role middleware", () => {
    const middleware = authorizeRoles(USER_ROLES.ADMIN);
    const req = {
      auth: {
        role: USER_ROLES.ADMIN,
      },
    };

    let nextError;

    middleware(req, {}, (error) => {
      nextError = error;
    });

    expect(nextError).toBeUndefined();
  });

  it("rejects admin service calls from non-admin context", async () => {
    await expect(
      adminService.listUsers(
        {
          page: 1,
          pageSize: 20,
        },
        {
          actorId: "507f1f77bcf86cd799439011",
          role: USER_ROLES.USER,
          requestId: "req-user-1",
        },
      ),
    ).rejects.toThrow("Admin privileges are required");
  });

  it("allows admin service calls from admin context", async () => {
    vi.spyOn(adminRepository, "listUsers").mockResolvedValue([]);
    vi.spyOn(adminRepository, "countUsers").mockResolvedValue(0);

    const result = await adminService.listUsers(
      {
        page: 1,
        pageSize: 20,
      },
      adminContext,
    );

    expect(result.items).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
  });
});
