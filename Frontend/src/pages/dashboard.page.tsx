import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading
} from "@/components";
import { queryKeys } from "@/constants";
import {
  buildReadinessChecklist,
  getActiveOrLatestSubscription,
  getDrawReadinessState,
  getLatestScore,
  getRecentActivityItems,
  getSelectedCharity,
  getSucceededDonationTotalMinor,
  getTotalWinnerPrizeMinor,
  getUnreadNotificationsCount,
  InsightCard,
  ReadinessChecklistCard
} from "@/features/dashboard";
import {
  formatCountdown,
  sortWinnersByRecent
} from "@/features/draws";
import {
  AccountInlineStatusCards,
  selectAccountStatusNotices
} from "@/features/notifications";
import { getQualifyingScores } from "@/features/scores";
import { useOnlineStatus } from "@/hooks";
import { routePaths } from "@/routes/paths";
import {
  charitiesService,
  notificationsService,
  paymentsService,
  scoresService,
  subscriptionsService,
  usersService,
  winnersService
} from "@/services";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  toStatusLabel,
  toStatusTone
} from "@/utils";

const QuickSummaryCard = ({
  title,
  description,
  value,
  eyebrow,
  tone = "muted",
  href,
  actionLabel = "Open",
  secondaryActionLabel,
  secondaryHref
}: {
  title: string;
  description: string;
  value: string;
  eyebrow?: string;
  tone?: "muted" | "success" | "warning" | "danger" | "info" | "accent" | "coral";
  href?: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  secondaryHref?: string;
}) => (
  <Card className="h-full bg-surface-elevated/95">
    <div className="flex h-full flex-col">
      {eyebrow ? <Badge tone={tone}>{eyebrow}</Badge> : null}
      <h3 className="mt-4 font-display text-2xl text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
      <p className="mt-5 font-display text-3xl text-foreground">{value}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {href ? (
          <ButtonLink to={href} variant="secondary" size="sm">
            {actionLabel}
          </ButtonLink>
        ) : null}
        {secondaryHref && secondaryActionLabel ? (
          <ButtonLink to={secondaryHref} variant="accent" size="sm">
            {secondaryActionLabel}
          </ButtonLink>
        ) : null}
      </div>
    </div>
  </Card>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data
  });
  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data
  });
  const paymentsQuery = useQuery({
    queryKey: queryKeys.myPayments,
    queryFn: async () => (await paymentsService.listMine()).data
  });
  const scoreHistoryQuery = useQuery({
    queryKey: queryKeys.myScores,
    queryFn: async () => (await scoresService.listMine()).data
  });
  const qualifyingScoresQuery = useQuery({
    queryKey: queryKeys.myQualifyingScores,
    queryFn: async () => (await scoresService.listQualifying()).data
  });
  const scoreEligibilityQuery = useQuery({
    queryKey: queryKeys.scoreEligibility,
    queryFn: async () => (await scoresService.getEligibility()).data
  });
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => (await notificationsService.listMine()).data
  });
  const winnersQuery = useQuery({
    queryKey: queryKeys.winners,
    queryFn: async () => (await winnersService.listMine()).data
  });
  const charitiesQuery = useQuery({
    queryKey: queryKeys.charities,
    queryFn: async () => (await charitiesService.list()).data
  });
  const charitySelectionQuery = useQuery({
    queryKey: queryKeys.myCharitySelection,
    queryFn: async () => (await charitiesService.getMySelection()).data
  });
  const donationsQuery = useQuery({
    queryKey: queryKeys.myDonations,
    queryFn: async () => (await charitiesService.listMyDonations()).data
  });

  const profileStatus = profileStatusQuery.data;
  const currentSubscription = getActiveOrLatestSubscription(subscriptionsQuery.data || []);
  const latestScore = getLatestScore(scoreHistoryQuery.data || []);
  const qualifyingScores = getQualifyingScores(qualifyingScoresQuery.data);
  const selectedCharity = getSelectedCharity({
    charities: charitiesQuery.data,
    selection: charitySelectionQuery.data
  });
  const readiness = buildReadinessChecklist({
    profileStatus,
    charitySelection: charitySelectionQuery.data,
    subscription: currentSubscription,
    scoreEligibility: scoreEligibilityQuery.data
  });
  const drawReadiness = getDrawReadinessState({
    profileStatus,
    subscription: currentSubscription,
    scoreEligibility: scoreEligibilityQuery.data
  });
  const unreadNotifications = getUnreadNotificationsCount(notificationsQuery.data || []);
  const totalWinningsMinor = getTotalWinnerPrizeMinor(winnersQuery.data || []);
  const sortedWinners = sortWinnersByRecent(winnersQuery.data || []);
  const nextProofDeadlineWinner = sortedWinners
    .filter((winner) => winner.verificationDeadlineAt)
    .sort(
      (left, right) =>
        new Date(left.verificationDeadlineAt || 0).getTime() -
        new Date(right.verificationDeadlineAt || 0).getTime()
    )[0];
  const totalDonationMinor = getSucceededDonationTotalMinor(donationsQuery.data || []);
  const recentActivity = getRecentActivityItems({
    notifications: notificationsQuery.data,
    scores: scoreHistoryQuery.data,
    payments: paymentsQuery.data,
    winners: winnersQuery.data
  });
  const accountNotices = selectAccountStatusNotices({
    profileStatus,
    subscription: currentSubscription,
    winners: winnersQuery.data
  });
  const criticalQueries = [
    profileStatusQuery,
    subscriptionsQuery,
    scoreHistoryQuery,
    scoreEligibilityQuery,
    winnersQuery,
    notificationsQuery
  ];
  const hasCriticalData = criticalQueries.some((query) => query.data !== undefined);
  const isInitialLoading =
    criticalQueries.some((query) => query.isPending) && !hasCriticalData;
  const hasBlockingError =
    criticalQueries.some((query) => query.isError) && !hasCriticalData;
  const retryDashboardQueries = async () => {
    await Promise.all(criticalQueries.map((query) => query.refetch()));
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Overview"
        title="A dashboard-first account area that keeps readiness and next steps front and center"
        description="Subscription status, profile verification, eligibility, and the missing-step path stay above the fold so members always know what is blocking them or what is already in great shape."
      />

      {!isOnline && hasCriticalData ? (
        <Alert tone="warning" title="Offline view">
          You are looking at the last synced dashboard state. New billing, score, and
          notification changes will appear after the connection returns.
        </Alert>
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={4} rows={4} /> : null}

      {!isInitialLoading && hasBlockingError ? (
        <OperationalStatePanel
          action={<RetryButton onClick={() => void retryDashboardQueries()} />}
          description="The dashboard could not load enough backend state to show readiness, billing, and recent activity safely."
          state="error"
          title="Dashboard data is temporarily unavailable"
        />
      ) : null}

      {!isInitialLoading && !hasBlockingError ? (
        <>
          <AccountInlineStatusCards notices={accountNotices} surface="dashboard" />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Subscription status"
          value={currentSubscription?.planNameSnapshot || "Not active"}
          helper={
            currentSubscription
              ? `${toStatusLabel(currentSubscription.status)} • ${
                  currentSubscription.nextBillingAt
                    ? `Next billing ${formatDate(currentSubscription.nextBillingAt)}`
                    : "Awaiting billing window"
                }`
              : "No active subscription record yet."
          }
          accent={
            currentSubscription?.status
              ? toStatusLabel(currentSubscription.status)
              : "Choose a plan"
          }
          icon={<WalletCards className="h-5 w-5" />}
        />
        <InsightCard
          label="Profile verification"
          value={toStatusLabel(profileStatus?.profileVerificationStatus || "pending_verification")}
          helper={
            profileStatus?.emailVerified
              ? "Email verified and ready for account review."
              : "Email verification still blocks paid activation."
          }
          accent={profileStatus?.emailVerified ? "Email verified" : "Verify email"}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <InsightCard
          label="Eligibility"
          value={profileStatus?.eligibleForSubscription ? "Ready" : "Needs action"}
          helper={drawReadiness.description}
          accent={drawReadiness.label}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <InsightCard
          label="Missing steps"
          value={readiness.remainingCount === 0 ? "All set" : `${readiness.remainingCount} left`}
          helper={`${readiness.completedCount} of ${readiness.items.length} readiness steps are complete.`}
          accent={readiness.remainingCount === 0 ? "Ready for the draw path" : "Complete the checklist"}
          icon={<ReceiptText className="h-5 w-5" />}
        />
      </div>

      {readiness.remainingCount > 0 ? (
        <ReadinessChecklistCard
          items={readiness.items.filter((item) => !item.completed)}
          completedCount={readiness.completedCount}
          remainingCount={readiness.remainingCount}
        />
      ) : (
        <Alert tone="success" title="You’ve cleared the current readiness checklist">
          Your profile, charity, billing, and qualifying-score steps are aligned with the current backend rules. Keep an eye on renewal state and fresh score submissions so upcoming participation stays healthy.
        </Alert>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <QuickSummaryCard
          title="Latest scores"
          description="Your dashboard starts with the most recent score signal instead of pushing you into a history table first."
          value={
            latestScore
              ? `${latestScore.value} on ${formatDate(latestScore.playedDate)}`
              : "No score yet"
          }
          eyebrow={`${qualifyingScores.length || 0} qualifying`}
          tone="accent"
          href={routePaths.scores}
          actionLabel="Open scores"
          secondaryActionLabel="Quick add"
          secondaryHref={`${routePaths.scores}?quickEntry=1`}
        />
        <QuickSummaryCard
          title="Upcoming draw"
          description={
            nextProofDeadlineWinner
              ? `You have a live winnings deadline in motion: ${formatCountdown(
                  nextProofDeadlineWinner.verificationDeadlineAt
                )}.`
              : drawReadiness.description
          }
          value={drawReadiness.label}
          eyebrow={drawReadiness.label}
          tone={drawReadiness.tone}
          href={routePaths.draws}
          actionLabel="Open draws"
          secondaryActionLabel="My winnings"
          secondaryHref={`${routePaths.draws}?tab=winnings`}
        />
        <QuickSummaryCard
          title="Winnings summary"
          description={
            nextProofDeadlineWinner
              ? `Next proof deadline ${formatDate(
                  nextProofDeadlineWinner.verificationDeadlineAt
                )}.`
              : "Any published winner record, proof workflow, and payout progress rolls up here first."
          }
          value={
            winnersQuery.data?.length
              ? `${winnersQuery.data.length} wins • ${formatCurrency(totalWinningsMinor / 100)}`
              : "No wins yet"
          }
          eyebrow={
            nextProofDeadlineWinner
              ? formatCountdown(nextProofDeadlineWinner.verificationDeadlineAt)
              : winnersQuery.data?.length
                ? "Tracked in backend"
                : "Still building"
          }
          tone={winnersQuery.data?.length ? "success" : "muted"}
          href={routePaths.draws}
          actionLabel="Open winnings"
          secondaryActionLabel={winnersQuery.data?.length ? "Proof status" : undefined}
          secondaryHref={
            winnersQuery.data?.length ? `${routePaths.draws}?tab=winnings` : undefined
          }
        />
        <QuickSummaryCard
          title="Charity impact"
          description={
            selectedCharity
              ? `Your current default impact destination is ${selectedCharity.name}.`
              : "Choose a charity so future payments know where the impact share should go."
          }
          value={
            totalDonationMinor > 0
              ? `${formatCurrency(totalDonationMinor / 100)} given`
              : selectedCharity?.name || "Not selected"
          }
          eyebrow={selectedCharity ? "Future payments set" : "Selection needed"}
          tone={selectedCharity ? "success" : "warning"}
          href={routePaths.charities}
        />
        <QuickSummaryCard
          title="Recent activity"
          description="Unread notifications, billing state changes, and score updates all feed this compact account summary."
          value={
            recentActivity[0]?.title ||
            (unreadNotifications ? `${unreadNotifications} unread` : "Quiet right now")
          }
          eyebrow={
            unreadNotifications ? `${unreadNotifications} unread notifications` : "Up to date"
          }
          tone={unreadNotifications ? "warning" : "info"}
          href={routePaths.notifications}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Details
              </p>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                Latest contest numbers and account pulse
              </h3>
            </div>
            <ButtonLink to={routePaths.scores} variant="secondary" size="sm">
              Open scores
            </ButtonLink>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Contest numbers</p>
                <Badge tone="accent">Latest five</Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                {qualifyingScores.map((score) => (
                  <div
                    key={score.id}
                    className="rounded-pill border border-border bg-surface-elevated px-4 py-3 font-display text-xl text-foreground shadow-soft"
                  >
                    {score.contestNumber}
                  </div>
                ))}
              </div>
              {!qualifyingScores.length ? (
                <EmptyState
                  title="No qualifying scores yet"
                  description="Add scores and avoid backdated or duplicate-number problems so your latest five can become active contest numbers."
                  actionLabel="Add scores"
                  onAction={() => navigate(routePaths.scores)}
                />
              ) : null}
            </div>

            <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Billing pulse</p>
                {currentSubscription?.status ? (
                  <Badge tone={toStatusTone(currentSubscription.status)}>
                    {toStatusLabel(currentSubscription.status)}
                  </Badge>
                ) : null}
              </div>
              {currentSubscription ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Plan
                      </p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {currentSubscription.planNameSnapshot}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Next billing
                      </p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {formatDate(currentSubscription.nextBillingAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Latest payment state: {toStatusLabel(currentSubscription.lastPaymentStatus)}.
                  </p>
                  <ButtonLink to={routePaths.subscriptions} variant="secondary" size="sm">
                    Open billing & subscription
                  </ButtonLink>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No subscription has been created yet. Start from the billing page when you’re ready.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Recent activity
              </p>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                What changed most recently
              </h3>
            </div>
            <ButtonLink to={routePaths.notifications} variant="secondary" size="sm">
              Open inbox
            </ButtonLink>
          </div>

          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <Badge tone="muted">{item.kind}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {formatDateTime(item.happenedAt)}
                </p>
              </div>
            ))}
            {!recentActivity.length ? (
              <p className="text-sm text-muted-foreground">
                No recent account activity yet. Notifications, score saves, payment transitions, and wins will appear here.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
        </>
      ) : null}
    </div>
  );
};
