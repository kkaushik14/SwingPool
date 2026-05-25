import { motion } from "framer-motion";
import { Home, LayoutPanelTop, Shield } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

import {
  APP_META,
  publicAccessNavigation,
  publicFooterNavigation,
  publicNavigation
} from "@/constants";
import { BrandMark, ButtonLink, MobileNavDrawer, ThemeToggle } from "@/components";
import { useAuth } from "@/features/auth";
import { routePaths } from "@/routes/paths";

export const PublicLayout = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const desktopNavigation = publicNavigation;
  const drawerNavigation = isAuthenticated
    ? [
        {
          label: "Home",
          to: routePaths.home,
          icon: Home,
          description: "Return to the public homepage.",
          section: "Discover"
        },
        ...publicNavigation,
        {
          label: isAdmin ? "Admin" : "Workspace",
          to: isAdmin ? routePaths.admin : routePaths.app,
          icon: isAdmin ? Shield : LayoutPanelTop,
          description: isAdmin
            ? "Return to the admin control plane."
            : "Return to the member workspace.",
          section: "Continue"
        }
      ]
    : [
        {
          label: "Home",
          to: routePaths.home,
          icon: Home,
          description: "Return to the public homepage.",
          section: "Discover"
        },
        ...publicNavigation,
        ...publicAccessNavigation
      ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <div className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80" />
      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 sm:px-6 lg:px-10">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/85 py-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <MobileNavDrawer items={drawerNavigation} title="Navigation" />
            <Link to="/">
              <BrandMark />
            </Link>
          </div>
          <nav className="hidden items-center gap-6 lg:flex">
            {desktopNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-sm font-semibold text-foreground"
                    : "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <ButtonLink to={isAdmin ? routePaths.admin : routePaths.app} variant="secondary">
                {isAdmin ? "Admin surface" : "Workspace"}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to={routePaths.login} variant="ghost" className="hidden sm:inline-flex">
                  Login
                </ButtonLink>
                <ButtonLink to={routePaths.signup}>{`Join the Draw`}</ButtonLink>
              </>
            )}
            <ThemeToggle />
          </div>
        </header>
        <motion.main
          id="main-content"
          className="flex-1 py-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet />
        </motion.main>
        <footer className="border-t border-border/70 py-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <BrandMark />
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                {APP_META.description}
              </p>
              {isAuthenticated ? (
                <div className="flex flex-wrap gap-3">
                  <ButtonLink to={isAdmin ? routePaths.admin : routePaths.app}>
                    {isAdmin ? "Return to admin" : "Return to workspace"}
                  </ButtonLink>
                  <ButtonLink to={routePaths.howItWorks} variant="secondary">
                    How It Works
                  </ButtonLink>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <ButtonLink to={routePaths.signup}>Join the Draw</ButtonLink>
                  <ButtonLink to={routePaths.howItWorks} variant="secondary">
                    How It Works
                  </ButtonLink>
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {publicFooterNavigation.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    {group.title}
                  </p>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-border/70 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Warm digital rituals for verified play, charitable impact, and reward readiness.</p>
            <p>Designed without traditional golf clichés or country-club nostalgia.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
