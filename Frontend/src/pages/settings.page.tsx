import { LifeBuoy, LogOut, MoonStar, Shield, UserRound } from "lucide-react";

import { Badge, Button, ButtonLink, Card, SectionHeading, ThemeToggle } from "@/components";
import { useAuth } from "@/features/auth";
import { routePaths } from "@/routes/paths";
import { formatDateTime, toStatusLabel } from "@/utils";

export const SettingsPage = () => {
  const { logout, session, user } = useAuth();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Settings"
        title="Account preferences, session safety, and support essentials"
        description="This page stays intentionally focused: appearance, account state, session hygiene, and where to go when you need help."
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary-soft p-3 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-foreground">Account snapshot</h3>
              <p className="text-sm text-muted-foreground">
                Read-only identity and current account state from the backend.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Display name</span>
              <span className="text-sm font-semibold text-foreground">
                {user?.displayName || "Member"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-semibold text-foreground">
                {user?.email || "Not available"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge tone="accent">{toStatusLabel(user?.role)}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Account status</span>
              <Badge tone="info">{toStatusLabel(user?.status)}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Last login</span>
              <span className="text-sm font-semibold text-foreground">
                {formatDateTime(user?.lastLoginAt)}
              </span>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent-soft p-3 text-accent-foreground">
                <MoonStar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Light and dark themes are available across the whole account area from the start.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Theme preference</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Switch between the warm light palette and the charcoal night palette.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-coral/20 p-3 text-coral">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-foreground">Session safety</h3>
                <p className="text-sm text-muted-foreground">
                  The member shell keeps authentication persistent, but sensitive work should still end with clean session habits.
                </p>
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Session persisted</span>
                <Badge tone={session ? "success" : "warning"}>
                  {session ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Saved locally</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatDateTime(session?.persistedAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => void logout()}>
                  <LogOut className="h-4 w-4" />
                  Sign out of this device
                </Button>
                <ButtonLink to={routePaths.profile} variant="accent">
                  Review profile details
                </ButtonLink>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-foreground">Need help?</h3>
                <p className="text-sm text-muted-foreground">
                  For billing, verification, and draw questions, the fastest routes are already linked from the public support surface.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to={routePaths.contact} variant="secondary">
                Contact support
              </ButtonLink>
              <ButtonLink to={routePaths.notifications} variant="secondary">
                Open notifications
              </ButtonLink>
              <ButtonLink to={routePaths.subscriptions} variant="accent">
                Open billing
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
