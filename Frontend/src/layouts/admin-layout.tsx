import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  adminNavigation,
  adminQuickActions,
  queryKeys
} from "@/constants";
import {
  Badge,
  Card,
  InlineWarningCard,
  NavLinkList,
  Skeleton,
  TopBanner
} from "@/components";
import { routePaths } from "@/routes/paths";
import { reportsService } from "@/services";

import { ShellLayout } from "./shell-layout";

const AdminSidebar = () => (
  <div className="space-y-4">
    <Card className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Operations posture
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Manual actions should always preserve request-aware reasoning, audit snapshots,
        and backend source-of-truth boundaries.
      </p>
    </Card>
    <Card className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Quick actions
      </p>
      <div className="mt-4">
        <NavLinkList items={adminQuickActions} compact />
      </div>
    </Card>
  </div>
);

const AdminSummaryStrip = () => {
  const overviewQuery = useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: async () => (await reportsService.getOverview()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  const summary = overviewQuery.data?.summary || {};
  const summaryCards = [
    {
      label: "Users",
      value: String(summary.totalUsers || "--")
    },
    {
      label: "Payments",
      value: String(summary.totalPayments || "--")
    },
    {
      label: "Charity total",
      value: String(summary.totalCharityAmount || "--")
    },
    {
      label: "Draws",
      value: String(summary.totalDraws || "--")
    }
  ];

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <Card
          key={card.label}
          className="rounded-2xl border border-border bg-surface-elevated/90 p-4 shadow-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {card.label}
          </p>
          {overviewQuery.isPending ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <p className="mt-3 font-display text-3xl text-foreground">{card.value}</p>
              <Badge tone="info" className="mt-3">
                Live from reports overview
              </Badge>
            </>
          )}
        </Card>
      ))}
    </div>
  );
};

export const AdminLayout = () => {
  return (
    <ShellLayout
      navigation={adminNavigation}
      modeLabel="Admin control plane"
      title="Operations and oversight"
      description="The admin shell stays more functional, denser, and explicitly traceable while preserving the same visual language as the member experience."
      mobileNavigationTitle="Admin navigation"
      headerAction={
        <Link
          to={routePaths.adminAudit}
          className="inline-flex h-11 items-center justify-center rounded-pill border border-border bg-surface px-5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-surface-soft"
        >
          Review audit routes
        </Link>
      }
      sidebarContent={<AdminSidebar />}
      topContent={
        <>
          <AdminSummaryStrip />
          <InlineWarningCard
            label="Operational safeguard"
            title="Sensitive admin actions should stay traceable to request ids and reasons."
            description="This shell assumes the backend remains authoritative for payments, draws, payouts, and manual overrides, so the frontend keeps those boundaries visible."
            action={
              <Link to={routePaths.adminAudit} className="underline-offset-4 hover:underline">
                Open reports surface
              </Link>
            }
          />
        </>
      }
      banner={
        <TopBanner
          tone="info"
          eyebrow="Admin shell"
          title="Operational tooling stays explicit, not magical."
          description="Navigation, empty states, and loading gates are designed to make backend-driven workflows clear instead of hiding important state transitions."
          action={
            <Link to={routePaths.adminExperienceKit} className="hover:text-primary">
              View admin patterns
            </Link>
          }
        />
      }
    />
  );
};
