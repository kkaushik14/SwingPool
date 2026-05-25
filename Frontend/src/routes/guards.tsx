import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AppLoadingScreen } from "@/components";
import { useAuth } from "@/features/auth";
import { getPostAuthRedirect, getReturnToPath } from "@/routes/access";

const LoadingState = () => <AppLoadingScreen />;

export const UserRoute = () => {
  const location = useLocation();
  const { authReady, isAdmin, isAuthenticated, isLoadingUser, session } = useAuth();

  if ((session?.accessToken && isLoadingUser) || !authReady) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: getReturnToPath(location) }}
      />
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const location = useLocation();
  const { authReady, isAuthenticated, isAdmin, isLoadingUser, session } = useAuth();

  if ((session?.accessToken && isLoadingUser) || !authReady) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: getReturnToPath(location) }}
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const location = useLocation();
  const { authReady, isAdmin, isAuthenticated, isLoadingUser, session } = useAuth();

  if ((session?.accessToken && isLoadingUser) || !authReady) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getPostAuthRedirect(
          isAdmin ? "admin" : "user",
          (location.state as { from?: string } | null)?.from
        )}
        replace
      />
    );
  }

  return <Outlet />;
};
