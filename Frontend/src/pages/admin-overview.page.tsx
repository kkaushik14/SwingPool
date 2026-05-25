import { useQuery } from "@tanstack/react-query";
import { DatabaseZap, Landmark, UsersRound, Wallet } from "lucide-react";

import {
  Card,
  EmptyState,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading
} from "@/components";
import { queryKeys } from "@/constants";
import { AdminChartCard, AdminMetricCard } from "@/features/admin";
import { reportsService } from "@/services";

const formatStatLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const toChartPoints = (record?: Record<string, number>) =>
  Object.entries(record || {})
    .sort((left, right) => right[1] - left[1])
    .map(([key, value]) => ({
      key,
      label: formatStatLabel(key),
      value
    }));

export const AdminOverviewPage = () => {
  const overviewQuery = useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: async () => (await reportsService.getOverview()).data
  });

  const summary = overviewQuery.data?.summary || {};
  const summaryEntries = Object.entries(summary);
  const chartSections = [
    {
      key: "users",
      title: "User mix",
      description: "Member and verification counts exposed by the backend overview surface.",
      points: toChartPoints(overviewQuery.data?.users),
      accent: "primary" as const
    },
    {
      key: "subscriptions",
      title: "Subscription states",
      description: "Current subscription lifecycle mix across the platform.",
      points: toChartPoints(overviewQuery.data?.subscriptions),
      accent: "accent" as const
    },
    {
      key: "payments",
      title: "Payment outcomes",
      description: "Webhook-confirmed payment state breakdown for the current report payload.",
      points: toChartPoints(overviewQuery.data?.payments),
      accent: "coral" as const
    },
    {
      key: "winners",
      title: "Winner lifecycle",
      description: "Proof and payout progression grouped by backend winner state.",
      points: toChartPoints(overviewQuery.data?.winners),
      accent: "accent" as const
    }
  ].filter((section) => section.points.length > 0);
  const hasOverviewData = Boolean(overviewQuery.data);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Operational visibility across the whole platform"
        description="This overview keeps the platform pulse readable at a glance, then expands into the backend-provided report slices without forcing operators to parse raw payloads."
      />

      {overviewQuery.isPending && !hasOverviewData ? <PageSectionSkeleton cards={4} rows={4} /> : null}

      {overviewQuery.isError && !hasOverviewData ? (
        <OperationalStatePanel
          state="error"
          title="Admin overview is unavailable"
          description="The frontend could not load the backend overview report yet, so this surface is holding off on rendering incomplete operations data."
          action={<RetryButton onClick={() => void overviewQuery.refetch()} />}
        />
      ) : null}

      {hasOverviewData ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              label="Users"
              value={String(summary.totalUsers || "--")}
              description="Verification and lifecycle visibility across the current report payload."
              icon={<UsersRound className="h-5 w-5" />}
              badge={{ label: "Member state overview", tone: "info" }}
            />
            <AdminMetricCard
              label="Payments"
              value={String(summary.totalPayments || "--")}
              description="Webhook-driven payment tracking remains the operational source of truth."
              icon={<Wallet className="h-5 w-5" />}
              badge={{ label: "Stripe-aligned", tone: "accent" }}
            />
            <AdminMetricCard
              label="Charity flow"
              value={String(summary.totalCharityAmount || "--")}
              description="Impact totals and payout-facing visibility from the overview report."
              icon={<Landmark className="h-5 w-5" />}
              badge={{ label: "Impact reporting", tone: "success" }}
            />
            <AdminMetricCard
              label="Draw ops"
              value={String(summary.totalDraws || "--")}
              description="Draw snapshots, results, and rollover-aware operational visibility."
              icon={<DatabaseZap className="h-5 w-5" />}
              badge={{ label: "Draw control plane", tone: "warning" }}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {chartSections.length ? (
              chartSections.map((section) => (
                <AdminChartCard
                  key={section.key}
                  title={section.title}
                  description={section.description}
                  points={section.points}
                  accent={section.accent}
                />
              ))
            ) : (
              <EmptyState
                align="center"
                eyebrow="Charts pending"
                title="This report payload does not include chart breakdowns yet."
                description="Once the backend sends grouped counts for users, subscriptions, payments, or winners, this overview card will visualize them automatically."
                className="xl:col-span-2"
              />
            )}
          </div>

          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Summary snapshot
              </p>
              <h3 className="font-display text-2xl text-foreground">
                Export-friendly key metrics
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                This table keeps the raw overview summary readable and ready for future export workflows without falling back to JSON.
              </p>
            </div>

            {summaryEntries.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {summaryEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-border/70 bg-surface-soft/85 px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {formatStatLabel(key)}
                    </p>
                    <p className="mt-3 font-display text-2xl text-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Summary pending"
                title="No summary metrics are available yet."
                description="The backend overview endpoint responded without summary keys, so this area is waiting for a fuller reporting payload."
              />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
};
