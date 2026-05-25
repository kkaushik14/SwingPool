import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminRoute, PublicOnlyRoute, UserRoute } from "@/routes/guards";

const authState = {
  authReady: true,
  isAdmin: false,
  isAuthenticated: false,
  isLoadingUser: false,
  session: null
};

vi.mock("@/features/auth", () => ({
  useAuth: () => authState
}));

describe("route guards", () => {
  beforeEach(() => {
    authState.authReady = true;
    authState.isAdmin = false;
    authState.isAuthenticated = false;
    authState.isLoadingUser = false;
    authState.session = null;
  });

  it("redirects unauthenticated users away from member routes", () => {
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<UserRoute />}>
            <Route path="/protected" element={<div>Protected</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders member routes when the user is authenticated and not admin", () => {
    authState.isAuthenticated = true;
    authState.session = {
      accessToken: "token",
      refreshToken: "refresh",
      persistedAt: "2026-04-25T00:00:00.000Z"
    };

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<UserRoute />}>
            <Route path="/protected" element={<div>Protected</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("redirects authenticated admins away from member-only routes", () => {
    authState.isAuthenticated = true;
    authState.isAdmin = true;
    authState.session = {
      accessToken: "token",
      refreshToken: "refresh",
      persistedAt: "2026-04-25T00:00:00.000Z"
    };

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/admin" element={<div>Admin home</div>} />
          <Route element={<UserRoute />}>
            <Route path="/protected" element={<div>Protected</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin home")).toBeInTheDocument();
  });

  it("redirects non-admin users away from admin routes", () => {
    authState.isAuthenticated = true;
    authState.session = {
      accessToken: "token",
      refreshToken: "refresh",
      persistedAt: "2026-04-25T00:00:00.000Z"
    };

    render(
      <MemoryRouter initialEntries={["/admin/reports"]}>
        <Routes>
          <Route path="/app" element={<div>Member home</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/reports" element={<div>Reports</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Member home")).toBeInTheDocument();
  });

  it("redirects authenticated members away from public-only auth routes", () => {
    authState.isAuthenticated = true;
    authState.session = {
      accessToken: "token",
      refreshToken: "refresh",
      persistedAt: "2026-04-25T00:00:00.000Z"
    };

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/app" element={<div>Member home</div>} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<div>Login form</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Member home")).toBeInTheDocument();
  });
});
