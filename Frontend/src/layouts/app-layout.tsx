import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { appNavigation, APP_META, queryKeys } from "@/constants";
import {
  Card,
  Badge,
  Skeleton,
  TopBanner
} from "@/components";
import { useAuth } from "@/features/auth";
import { getActiveOrLatestSubscription } from "@/features/dashboard";
import {
  AccountTopBanners,
  NotificationCenter,
  selectAccountStatusNotices
} from "@/features/notifications";
import { getEligibilityExplanation } from "@/features/scores";
import { routePaths } from "@/routes/paths";
import { scoresService, subscriptionsService, usersService, winnersService } from "@/services";
import { toStatusLabel } from "@/utils";

import { ShellLayout } from "./shell-layout";

const ProfileStatusSidebar = () => {
  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const scoreEligibilityQuery = useQuery({
    queryKey: queryKeys.scoreEligibility,
    queryFn: async () => (await scoresService.getEligibility()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const currentSubscription = getActiveOrLatestSubscription(subscriptionsQuery.data || []);
  const scoreEligibilityExplanation = getEligibilityExplanation(scoreEligibilityQuery.data);

  return (
    <Card className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Account status
      </p>
      {profileStatusQuery.isPending ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>Email</span>
            <Badge tone={profileStatusQuery.data?.emailVerified ? "success" : "warning"}>
              {profileStatusQuery.data?.emailVerified ? "Verified" : "Pending"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Profile review</span>
            <Badge
              tone={
                profileStatusQuery.data?.eligibleForSubscription ? "success" : "warning"
              }
            >
              {toStatusLabel(profileStatusQuery.data?.profileVerificationStatus)}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Billing</span>
            <Badge tone={currentSubscription?.status === "active" ? "success" : "warning"}>
              {toStatusLabel(currentSubscription?.status || "pending")}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Draw readiness</span>
            <Badge tone={scoreEligibilityExplanation.tone}>
              {scoreEligibilityQuery.data?.isEligible ? "Ready" : "Pending"}
            </Badge>
          </div>
          <p className="rounded-2xl bg-surface-soft p-3">
            {APP_META.tagline}
          </p>
        </div>
      )}
    </Card>
  );
};

export const AppLayout = () => {
  const { user } = useAuth();
  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const winnersQuery = useQuery({
    queryKey: queryKeys.winners,
    queryFn: async () => (await winnersService.listMine()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  const accountNotices = selectAccountStatusNotices({
    profileStatus: profileStatusQuery.data,
    subscription: getActiveOrLatestSubscription(subscriptionsQuery.data || []),
    winners: winnersQuery.data
  });
  const shellBannerItems = user?.mustRotatePassword
    ? [
        {
          id: "rotate-bootstrap-password",
          label: "Credential safety",
          title: "Rotate your bootstrap password before continuing sensitive work",
          description:
            "The backend marked this account for credential rotation, so we keep surfacing that risk until it is resolved.",
          tone: "danger" as const,
          priority: 110,
          href: routePaths.settings,
          actionLabel: "Open settings",
          surfaces: ["banner", "dashboard", "profile", "billing", "draws", "notifications"] as const
        },
        ...accountNotices
      ]
    : accountNotices;

  return (
    <ShellLayout
      navigation={appNavigation}
      modeLabel="Member account"
      title={user?.displayName ? `${user.displayName}'s account` : "Member account"}
      description="Overview first, then profile, billing, scores, winnings, impact, notifications, and settings in one responsive account shell."
      mobileNavigationTitle="Account navigation"
      headerAction={
        <Link
          to={routePaths.subscriptions}
          className="inline-flex h-11 items-center justify-center rounded-pill border border-border bg-surface px-5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-surface-soft"
        >
          Open billing
        </Link>
      }
      headerAccessory={<NotificationCenter />}
      sidebarContent={<ProfileStatusSidebar />}
      banner={
        shellBannerItems.length ? (
          <AccountTopBanners notices={shellBannerItems} />
        ) : (
          <TopBanner
            tone="success"
            eyebrow="Account posture"
            title="Your member shell is synced with the current backend rules"
            description="We keep verification, billing, winnings, and notifications honest to backend truth while still making the next step easy to see."
            action={
              <Link to={routePaths.notifications} className="hover:text-primary">
                Open notifications
              </Link>
            }
          />
        )
      }
    />
  );
};
