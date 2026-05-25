import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Outlet } from "react-router-dom";

import type { NavigationItem } from "@/constants";
import {
  BrandMark,
  Button,
  MobileNavDrawer,
  NavLinkList,
  ThemeToggle,
  TopBanner
} from "@/components";
import { useAuth } from "@/features/auth";
import { useOnlineStatus } from "@/hooks";

interface ShellLayoutProps {
  navigation: NavigationItem[];
  modeLabel: string;
  title: string;
  description: string;
  mobileNavigationTitle: string;
  sidebarContent?: ReactNode;
  headerAction?: ReactNode;
  headerAccessory?: ReactNode;
  topContent?: ReactNode;
  banner?: ReactNode;
}

export const ShellLayout = ({
  navigation,
  modeLabel,
  title,
  description,
  mobileNavigationTitle,
  sidebarContent,
  headerAction,
  headerAccessory,
  topContent,
  banner
}: ShellLayoutProps) => {
  const { logout, user } = useAuth();
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <div className="mx-auto grid min-h-screen max-w-[1600px] md:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-border/70 bg-surface/70 p-6 backdrop-blur md:flex md:flex-col">
          <BrandMark />
          <div className="mt-8 flex-1">
            <NavLinkList items={navigation} />
          </div>
          {sidebarContent}
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <MobileNavDrawer items={navigation} title={mobileNavigationTitle} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      {modeLabel}
                    </p>
                    <h1 className="truncate font-display text-2xl text-foreground">
                      {title}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {headerAction ? (
                    <div className="hidden lg:block">{headerAction}</div>
                  ) : null}
                  {headerAccessory}
                  <ThemeToggle />
                  <div className="hidden rounded-pill border border-border bg-surface px-4 py-2 text-sm text-muted-foreground sm:block">
                    {user?.email || "Local preview"}
                  </div>
                  <Button variant="secondary" onClick={() => void logout()}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </div>

              {headerAction ? <div className="lg:hidden">{headerAction}</div> : null}
            </div>
          </header>

          <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {!isOnline ? (
              <TopBanner
                tone="warning"
                eyebrow="Offline mode"
                title="Connection lost"
                description="We can keep previously loaded data visible, but new account, billing, and notification updates will wait until the network returns."
              />
            ) : null}
            {banner}
            {topContent}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
