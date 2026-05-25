import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Award,
  CircleGauge,
  FileImage,
  FileUp,
  Gift,
  Trophy,
  UploadCloud
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading,
  Spinner,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabPanel
} from "@/components";
import { queryKeys } from "@/constants";
import {
  buildWinnerLifecycleSteps,
  clearProofDraftFiles,
  DEFAULT_DRAW_CONFIG,
  appendProofDraftFiles,
  fileToDataUrl,
  formatCountdown,
  formatFileSize,
  getEffectiveDrawConfig,
  getJackpotMessage,
  getLatestProofSubmission,
  getLatestPublishedDraw,
  getParticipationSummary,
  getProofDeadlineTone,
  getProofSubmissionGuidance,
  getPublishedResultSummary,
  getRewardExplainerItems,
  isCurrentMonthWinner,
  removeProofDraftFile,
  sortWinnersByRecent,
  type ProofDraftFile
} from "@/features/draws";
import {
  getActiveOrLatestSubscription,
  getDrawReadinessState,
  getTotalWinnerPrizeMinor,
  InsightCard
} from "@/features/dashboard";
import {
  AccountInlineStatusCards,
  selectAccountStatusNotices
} from "@/features/notifications";
import { useAuth } from "@/features/auth";
import { useOnlineStatus } from "@/hooks";
import { queryClient } from "@/lib";
import { routePaths } from "@/routes/paths";
import {
  drawsService,
  scoresService,
  subscriptionsService,
  usersService,
  winnersService
} from "@/services";
import type { WinnerProofSubmissionRecord } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  toStatusLabel,
  toStatusTone
} from "@/utils";

type DrawTab = "participation" | "results" | "winnings";

const drawTabOptions = [
  { value: "participation", label: "Participation" },
  { value: "results", label: "Results & Jackpot" },
  { value: "winnings", label: "My Winnings" }
] satisfies Array<{ value: DrawTab; label: string }>;

const isValidDrawTab = (value?: string | null): value is DrawTab =>
  value === "participation" || value === "results" || value === "winnings";

export const DrawsPage = () => {
  const { isAdmin } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [draftFiles, setDraftFiles] = useState<ProofDraftFile[]>([]);
  const [isDraggingProof, setIsDraggingProof] = useState(false);
  const [proofSubmitSuccess, setProofSubmitSuccess] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const draftFilesRef = useRef<ProofDraftFile[]>([]);

  const activeTab = isValidDrawTab(searchParams.get("tab"))
    ? (searchParams.get("tab") as DrawTab)
    : "participation";

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000 * 60);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    draftFilesRef.current = draftFiles;
  }, [draftFiles]);

  useEffect(
    () => () => {
      clearProofDraftFiles({ current: draftFilesRef.current });
    },
    []
  );

  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data
  });
  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data
  });
  const qualifyingScoresQuery = useQuery({
    queryKey: queryKeys.myQualifyingScores,
    queryFn: async () => (await scoresService.listQualifying()).data
  });
  const scoreEligibilityQuery = useQuery({
    queryKey: queryKeys.scoreEligibility,
    queryFn: async () => (await scoresService.getEligibility()).data
  });
  const winnersQuery = useQuery({
    queryKey: queryKeys.winners,
    queryFn: async () => (await winnersService.listMine()).data
  });
  const drawsQuery = useQuery({
    queryKey: queryKeys.draws,
    queryFn: async () => (await drawsService.list()).data,
    enabled: isAdmin,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const drawConfigQuery = useQuery({
    queryKey: queryKeys.drawConfig,
    queryFn: async () => (await drawsService.getConfig()).data,
    enabled: isAdmin,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  const sortedWinners = useMemo(
    () => sortWinnersByRecent(winnersQuery.data || []),
    [winnersQuery.data]
  );

  useEffect(() => {
    if (!selectedWinnerId && sortedWinners[0]?.id) {
      setSelectedWinnerId(sortedWinners[0].id);
    }

    if (
      selectedWinnerId &&
      !sortedWinners.some((winner) => winner.id === selectedWinnerId)
    ) {
      setSelectedWinnerId(sortedWinners[0]?.id || null);
    }
  }, [selectedWinnerId, sortedWinners]);

  const winnerDetailQuery = useQuery({
    queryKey: selectedWinnerId ? queryKeys.winnerDetail(selectedWinnerId) : ["winners", "detail", "idle"],
    queryFn: async () => {
      if (!selectedWinnerId) {
        return null;
      }

      return (await winnersService.getMineById(selectedWinnerId)).data;
    },
    enabled: Boolean(selectedWinnerId)
  });
  const winnerProofsQuery = useQuery({
    queryKey: selectedWinnerId ? queryKeys.winnerProofs(selectedWinnerId) : ["winners", "proofs", "idle"],
    queryFn: async () => {
      if (!selectedWinnerId) {
        return [] as WinnerProofSubmissionRecord[];
      }

      return (await winnersService.listProofs(selectedWinnerId)).data;
    },
    enabled: Boolean(selectedWinnerId)
  });

  const currentSubscription = getActiveOrLatestSubscription(subscriptionsQuery.data || []);
  const scoreEligibility = scoreEligibilityQuery.data;
  const qualifyingScores = qualifyingScoresQuery.data?.scores || [];
  const drawReadiness = getDrawReadinessState({
    profileStatus: profileStatusQuery.data,
    subscription: currentSubscription,
    scoreEligibility
  });
  const totalWinningsMinor = getTotalWinnerPrizeMinor(sortedWinners);
  const currentMonthWinner = sortedWinners.find((winner) =>
    isCurrentMonthWinner(winner, now)
  );
  const participationSummary = getParticipationSummary({
    subscription: currentSubscription,
    scoreEligibility,
    qualifyingCount: scoreEligibility?.qualifyingCount || 0,
    hasCurrentMonthWinner: Boolean(currentMonthWinner)
  });

  const latestPublishedDraw = getLatestPublishedDraw(drawsQuery.data || []);
  const latestPublishedDrawId = latestPublishedDraw?.id;
  const publishedResultQuery = useQuery({
    queryKey: latestPublishedDrawId
      ? queryKeys.drawResult(latestPublishedDrawId)
      : ["draws", "result", "idle"],
    queryFn: async () => {
      if (!latestPublishedDrawId) {
        return null;
      }

      return (await drawsService.getPublishedResult(latestPublishedDrawId)).data;
    },
    enabled: Boolean(isAdmin && latestPublishedDrawId),
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const prizePoolQuery = useQuery({
    queryKey: latestPublishedDrawId
      ? queryKeys.drawPrizePool(latestPublishedDrawId)
      : ["draws", "prize-pool", "idle"],
    queryFn: async () => {
      if (!latestPublishedDrawId) {
        return null;
      }

      return (await drawsService.getPrizePool(latestPublishedDrawId)).data;
    },
    enabled: Boolean(isAdmin && latestPublishedDrawId),
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  const effectiveDrawConfig = getEffectiveDrawConfig(
    drawConfigQuery.data || DEFAULT_DRAW_CONFIG
  );
  const rewardExplainerItems = getRewardExplainerItems(
    effectiveDrawConfig.prizeDistribution
  );
  const publishedResultSummary = getPublishedResultSummary({
    draw: latestPublishedDraw,
    result: publishedResultQuery.data
  });
  const jackpotMessage = getJackpotMessage(prizePoolQuery.data);

  const selectedWinner =
    winnerDetailQuery.data ||
    sortedWinners.find((winner) => winner.id === selectedWinnerId) ||
    null;
  const winnerProofs = winnerProofsQuery.data || [];
  const latestProof = getLatestProofSubmission(winnerProofs);
  const proofGuidance = getProofSubmissionGuidance({
    winner: selectedWinner,
    latestProof,
    now
  });
  const lifecycleSteps = buildWinnerLifecycleSteps({
    winner: selectedWinner,
    latestProof,
    now
  });
  const nextProofDeadlineWinner = sortedWinners
    .filter((winner) => winner.verificationDeadlineAt)
    .sort(
      (left, right) =>
        new Date(left.verificationDeadlineAt || 0).getTime() -
        new Date(right.verificationDeadlineAt || 0).getTime()
    )[0];
  const accountNotices = selectAccountStatusNotices({
    profileStatus: profileStatusQuery.data,
    subscription: currentSubscription,
    winners: sortedWinners,
    now
  });
  const criticalQueries = [
    profileStatusQuery,
    subscriptionsQuery,
    qualifyingScoresQuery,
    scoreEligibilityQuery,
    winnersQuery
  ];
  const hasCriticalData = criticalQueries.some((query) => query.data !== undefined);
  const isInitialLoading =
    criticalQueries.some((query) => query.isPending) && !hasCriticalData;
  const hasBlockingError =
    criticalQueries.some((query) => query.isError) && !hasCriticalData;
  const retryDrawQueries = async () => {
    await Promise.all(criticalQueries.map((query) => query.refetch()));
  };

  const proofSubmitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWinnerId) {
        throw new Error("Choose a winner record before submitting proof.");
      }

      const serializedFiles = await Promise.all(
        draftFiles.map(async (item) => ({
          fileUrl: await fileToDataUrl(item.file),
          fileName: item.file.name,
          fileType: item.file.type || undefined,
          sizeBytes: item.file.size || undefined
        }))
      );

      return await winnersService.submitProofs(selectedWinnerId, {
        files: serializedFiles,
        metadata: {
          submittedFromFrontend: true
        }
      });
    },
    meta: {
      toastOnError: true,
      toastTitle: "We could not submit your proof"
    },
    onSuccess: async () => {
      setProofSubmitSuccess(
        "Your proof submission was sent to the backend for review. Winner status will update after verification."
      );
      setDraftFiles((current) => clearProofDraftFiles({ current }));

      if (selectedWinnerId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.winners }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.winnerDetail(selectedWinnerId)
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.winnerProofs(selectedWinnerId)
          })
        ]);
      }
    }
  });

  const setActiveTab = (tab: DrawTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const openFileDialog = (replaceIndex?: number) => {
    replaceIndexRef.current = typeof replaceIndex === "number" ? replaceIndex : null;
    fileInputRef.current?.click();
  };

  const appendDraftFiles = (files: File[]) => {
    if (!files.length) {
      return;
    }

    setProofSubmitSuccess(null);

    setDraftFiles((current) => {
      const next = appendProofDraftFiles({
        current,
        files,
        maxProofFiles: effectiveDrawConfig.maxProofFiles,
        replaceIndex: replaceIndexRef.current
      });

      replaceIndexRef.current = null;
      return next;
    });
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendDraftFiles(Array.from(event.target.files || []));
    event.currentTarget.value = "";
  };

  const handleRemoveDraft = (draftId: string) => {
    setDraftFiles((current) => removeProofDraftFile({ current, draftId }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingProof(false);
    appendDraftFiles(Array.from(event.dataTransfer.files || []));
  };

  const participationSteps = [
    {
      title: "Keep your subscription active",
      description:
        currentSubscription?.status === "active"
          ? "Your subscription is active, so billing is currently aligned for draw entry."
          : "A live subscription is required on draw day for participation to count.",
      state:
        currentSubscription?.status === "active"
          ? ("complete" as const)
          : currentSubscription?.status === "grace_period"
            ? ("current" as const)
            : ("upcoming" as const)
    },
    {
      title: "Hold five qualifying contest numbers",
      description:
        scoreEligibility?.isEligible
          ? "Your latest five qualifying scores are distinct and ready."
          : "The latest five qualifying score window still needs attention before the automatic entry is safe.",
      state: scoreEligibility?.isEligible ? ("complete" as const) : ("current" as const)
    },
    {
      title: "Clear the month-end cutoff",
      description: `Entries must be ready before the last ${effectiveDrawConfig.eligibilityCutoffDaysBeforeMonthEnd} days of the month.`,
      state:
        currentSubscription?.status === "active" && scoreEligibility?.isEligible
          ? ("current" as const)
          : ("upcoming" as const)
    },
    {
      title: "Move into published results",
      description:
        currentMonthWinner
          ? "A winner record exists this month, so you are already in the published-result lifecycle."
          : "Once the draw publishes, winnings and proof requirements appear here.",
      state: currentMonthWinner ? ("complete" as const) : ("upcoming" as const)
    }
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Draws & Winnings"
        title="Track participation, published outcomes, and every winnings step in one place"
        description="This area keeps draw readiness, result visibility, proof submission, and payout progress grounded in backend state without hiding the operational details that matter to members."
      />

      {!isOnline && hasCriticalData ? (
        <Alert tone="warning" title="Offline view">
          You can still review the last synced participation and winnings state, but proof uploads
          and fresh draw updates need an active connection.
        </Alert>
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={4} rows={4} /> : null}

      {!isInitialLoading && hasBlockingError ? (
        <OperationalStatePanel
          action={<RetryButton onClick={() => void retryDrawQueries()} />}
          description="Participation, eligibility, or winnings data could not be loaded from the backend."
          state="error"
          title="Draw and winnings data is temporarily unavailable"
        />
      ) : null}

      {!isInitialLoading && !hasBlockingError ? (
        <>
          <AccountInlineStatusCards notices={accountNotices} surface="draws" />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Current month participation"
          value={participationSummary.title}
          helper={participationSummary.description}
          accent={participationSummary.label}
          icon={<Trophy className="h-5 w-5" />}
        />
        <InsightCard
          label="Eligibility state"
          value={scoreEligibility?.isEligible ? "Eligible" : "Not eligible"}
          helper={drawReadiness.description}
          accent={`${scoreEligibility?.qualifyingCount || 0}/${
            scoreEligibility?.rule.qualifyingWindowSize || 5
          } qualifying`}
          icon={<CircleGauge className="h-5 w-5" />}
        />
        <InsightCard
          label="Published result"
          value={latestPublishedDraw?.drawMonthKey || "User-safe snapshot pending"}
          helper={publishedResultSummary.description}
          accent={latestPublishedDraw ? toStatusLabel(latestPublishedDraw.status) : "Winner records stay live"}
          icon={<Gift className="h-5 w-5" />}
        />
        <InsightCard
          label="My winnings"
          value={
            sortedWinners.length
              ? `${sortedWinners.length} win${sortedWinners.length > 1 ? "s" : ""}`
              : "No wins yet"
          }
          helper={
            nextProofDeadlineWinner
              ? `Next proof deadline ${formatDate(
                  nextProofDeadlineWinner.verificationDeadlineAt
                )} • ${formatCountdown(nextProofDeadlineWinner.verificationDeadlineAt, now)}`
              : "Winner proof and payout progress will appear here when applicable."
          }
          accent={totalWinningsMinor ? formatCurrency(totalWinningsMinor / 100) : "₹0"}
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      <Card className="space-y-5 bg-surface-elevated/95">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Reward explainer
            </p>
            <h3 className="mt-2 font-display text-2xl text-foreground">
              How 5-match, 4-match, and 3-match rewards work
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Your five qualifying scores become the five contest numbers. The reward buckets below
              reflect the current draw-engine rules and the jackpot rollover behavior already coded
              into the backend.
            </p>
          </div>
          <Badge tone="accent">{effectiveDrawConfig.numbersPerDraw} numbers per draw</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {rewardExplainerItems.map((item) => (
            <div
              key={item.matchCount}
              className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5"
            >
              <Badge tone={item.matchCount === 5 ? "accent" : "info"}>
                {item.matchCount}-match
              </Badge>
              <h4 className="mt-4 font-display text-2xl text-foreground">{item.label}</h4>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.share}% bucket</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DrawTab)}
          options={drawTabOptions}
        />
        <ButtonLink to={routePaths.app} variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>

      <TabPanel className={activeTab === "participation" ? "block" : "hidden"}>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Participation
                </p>
                <h3 className="mt-2 font-display text-2xl text-foreground">
                  Current month participation status
                </h3>
              </div>
              <Badge tone={participationSummary.tone}>{participationSummary.label}</Badge>
            </div>

            <Alert
              tone={
                participationSummary.tone === "success"
                  ? "success"
                  : participationSummary.tone === "warning"
                    ? "warning"
                    : "info"
              }
              title={participationSummary.title}
            >
              {participationSummary.description}
            </Alert>

            <Stepper steps={participationSteps} />

            <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
              <p className="text-sm font-semibold text-foreground">Why this matters</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Every eligible active subscriber receives exactly one automatic entry per month,
                regardless of whether the plan is monthly, quarterly, or yearly. The cutoff happens
                before the last {effectiveDrawConfig.eligibilityCutoffDaysBeforeMonthEnd} days of
                the month, so last-minute fixes can miss the draw.
              </p>
            </div>
          </Card>

          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Contest numbers
                </p>
                <h3 className="mt-2 font-display text-2xl text-foreground">
                  Your qualifying competition set
                </h3>
              </div>
              <Badge tone={scoreEligibility?.isEligible ? "success" : "warning"}>
                {scoreEligibility?.qualifyingCount || 0}/
                {scoreEligibility?.rule.qualifyingWindowSize || 5}
              </Badge>
            </div>

            {qualifyingScores.length ? (
              <>
                <div className="flex flex-wrap gap-3">
                  {qualifyingScores.map((score, index) => (
                    <div
                      key={score.id}
                      className="rounded-pill border border-border bg-surface-soft px-4 py-3 font-display text-xl text-foreground"
                    >
                      {index + 1}. {score.contestNumber}
                    </div>
                  ))}
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  These are the latest five qualifying numbers currently eligible to represent you
                  in the draw. If you need to fix readiness, go back to the score area and keep the
                  latest five distinct.
                </p>
                <ButtonLink to={routePaths.scores} variant="secondary" size="sm">
                  Open scores
                </ButtonLink>
              </>
            ) : (
              <EmptyState
                eyebrow="No qualifying set yet"
                title="Your contest numbers will appear here"
                description="Five non-backdated qualifying scores are required before the current competition set is complete."
                actionLabel="Add scores"
                onAction={() => navigate(`${routePaths.scores}?quickEntry=1`)}
              />
            )}
          </Card>
        </div>
      </TabPanel>

      <TabPanel className={activeTab === "results" ? "block" : "hidden"}>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Published result
                </p>
                <h3 className="mt-2 font-display text-2xl text-foreground">
                  Latest published draw outcome
                </h3>
              </div>
              <Badge tone={latestPublishedDraw ? toStatusTone(latestPublishedDraw.status) : "muted"}>
                {latestPublishedDraw ? toStatusLabel(latestPublishedDraw.status) : "Not exposed"}
              </Badge>
            </div>

            {latestPublishedDraw && publishedResultQuery.data ? (
              <>
                <Alert tone="success" title={publishedResultSummary.title}>
                  {publishedResultSummary.description}
                </Alert>
                <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Winning numbers</p>
                    <Badge tone="accent">{latestPublishedDraw.drawMonthKey}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {publishedResultQuery.data.winningNumbers.map((number) => (
                      <div
                        key={number}
                        className="rounded-pill border border-border bg-surface-elevated px-4 py-3 font-display text-xl text-foreground shadow-soft"
                      >
                        {number}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Published at
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {formatDateTime(
                          publishedResultQuery.data.publishedAt ||
                            latestPublishedDraw.publishedAt
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Draw date
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {formatDate(latestPublishedDraw.drawAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Alert tone="info" title={publishedResultSummary.title}>
                {publishedResultSummary.description}
              </Alert>
            )}
          </Card>

          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Jackpot & prize pool
                </p>
                <h3 className="mt-2 font-display text-2xl text-foreground">
                  Rollover and reward snapshot
                </h3>
              </div>
              <Badge tone="accent">Prize flow</Badge>
            </div>

            <Alert tone="info" title={jackpotMessage.title}>
              {jackpotMessage.description}
            </Alert>

            {prizePoolQuery.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Jackpot carry in
                    </p>
                    <p className="mt-3 font-display text-3xl text-foreground">
                      {formatCurrency(prizePoolQuery.data.jackpotCarryInMinor / 100)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Balance carried into this published draw.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Jackpot carry out
                    </p>
                    <p className="mt-3 font-display text-3xl text-foreground">
                      {formatCurrency(prizePoolQuery.data.jackpotCarryOutMinor / 100)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Amount rolling into the next draw after publication.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      5-match
                    </p>
                    <p className="mt-3 font-display text-2xl text-foreground">
                      {prizePoolQuery.data.winners5Count} winner(s)
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Paid {formatCurrency(prizePoolQuery.data.match5PaidMinor / 100)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      4-match
                    </p>
                    <p className="mt-3 font-display text-2xl text-foreground">
                      {prizePoolQuery.data.winners4Count} winner(s)
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Paid {formatCurrency(prizePoolQuery.data.match4PaidMinor / 100)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      3-match
                    </p>
                    <p className="mt-3 font-display text-2xl text-foreground">
                      {prizePoolQuery.data.winners3Count} winner(s)
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Paid {formatCurrency(prizePoolQuery.data.match3PaidMinor / 100)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5 text-sm leading-7 text-muted-foreground">
                The backend currently exposes full prize-pool snapshots only on the admin-safe draw
                surface. Until that user-facing snapshot is available, the reward explainer and your
                personal winnings remain the reliable member view.
              </div>
            )}
          </Card>
        </div>
      </TabPanel>

      <TabPanel className={activeTab === "winnings" ? "block" : "hidden"}>
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-5 bg-surface-elevated/95">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  My winnings
                </p>
                <h3 className="mt-2 font-display text-2xl text-foreground">
                  Win details, proof status, and payout progress
                </h3>
              </div>
              <Badge tone={sortedWinners.length ? "success" : "muted"}>
                {sortedWinners.length
                  ? `${sortedWinners.length} result${sortedWinners.length > 1 ? "s" : ""}`
                  : "No wins yet"}
              </Badge>
            </div>

            {sortedWinners.length ? (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Match</TableHeaderCell>
                        <TableHeaderCell>Prize</TableHeaderCell>
                        <TableHeaderCell>Proof</TableHeaderCell>
                        <TableHeaderCell>Payout</TableHeaderCell>
                        <TableHeaderCell>Deadline</TableHeaderCell>
                        <TableHeaderCell>Details</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {sortedWinners.map((winner) => (
                        <TableRow key={winner.id}>
                          <TableCell>{winner.matchCount}-match</TableCell>
                          <TableCell>{winner.prizeAmountMajor}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={winner.proofSubmissionCount ? "info" : "warning"}>
                                {winner.proofSubmissionCount || 0} submission(s)
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge tone={toStatusTone(winner.payoutStatus)}>
                              {toStatusLabel(winner.payoutStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p>{formatDate(winner.verificationDeadlineAt)}</p>
                              <Badge tone={getProofDeadlineTone(winner, now)}>
                                {formatCountdown(winner.verificationDeadlineAt, now)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={
                                selectedWinner?.id === winner.id ? "accent" : "secondary"
                              }
                              size="sm"
                              onClick={() => setSelectedWinnerId(winner.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-4 md:hidden">
                  {sortedWinners.map((winner) => (
                    <div
                      key={winner.id}
                      className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">
                          {winner.matchCount}-match • {winner.prizeAmountMajor}
                        </p>
                        <Badge tone={toStatusTone(winner.payoutStatus)}>
                          {toStatusLabel(winner.payoutStatus)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Deadline {formatDate(winner.verificationDeadlineAt)} •{" "}
                        {formatCountdown(winner.verificationDeadlineAt, now)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {winner.proofSubmissionCount || 0} proof submission(s)
                      </p>
                      <Button
                        variant={
                          selectedWinner?.id === winner.id ? "accent" : "secondary"
                        }
                        size="sm"
                        className="mt-4"
                        onClick={() => setSelectedWinnerId(winner.id)}
                      >
                        View details
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                eyebrow="No wins yet"
                title="Your winnings history will build here"
                description="When a published draw creates a winner record for your account, this area becomes the home for proof submission, review updates, rejection reasons, and payout progress."
              />
            )}
          </Card>

          <Card className="space-y-5 bg-surface-elevated/95">
            {selectedWinner ? (
              <>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      Selected win
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-foreground">
                      {selectedWinner.matchCount}-match • {selectedWinner.prizeAmountMajor}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Review the proof deadline, matched numbers, rejection details, and payout
                      status before submitting or replacing proof.
                    </p>
                  </div>
                  <Badge tone={toStatusTone(selectedWinner.payoutStatus)}>
                    {toStatusLabel(selectedWinner.payoutStatus)}
                  </Badge>
                </div>

                {proofSubmitSuccess ? (
                  <Alert tone="success" title="Proof submitted">
                    {proofSubmitSuccess}
                  </Alert>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Contest numbers
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedWinner.contestNumbers.map((number) => (
                        <Badge key={number} tone="muted">
                          {number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Matched numbers
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedWinner.matchedNumbers.map((number) => (
                        <Badge key={number} tone="success">
                          {number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Proof deadline
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {formatDate(selectedWinner.verificationDeadlineAt)}
                    </p>
                    <div className="mt-3">
                      <Badge tone={getProofDeadlineTone(selectedWinner, now)}>
                        {formatCountdown(selectedWinner.verificationDeadlineAt, now)}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Latest proof status
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {latestProof ? toStatusLabel(latestProof.status) : "Not submitted"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {latestProof
                        ? `Submission #${latestProof.submissionNumber} on ${formatDateTime(
                            latestProof.submittedAt
                          )}`
                        : "No proof has been submitted for this win yet."}
                    </p>
                  </div>
                </div>

                {selectedWinner.rejectionReason?.trim() || latestProof?.rejectionReason?.trim() ? (
                  <Alert tone="warning" title="Rejection reason">
                    {selectedWinner.rejectionReason?.trim() ||
                      latestProof?.rejectionReason?.trim()}
                  </Alert>
                ) : null}

                <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      Verification & payout timeline
                    </p>
                    <Badge tone={toStatusTone(selectedWinner.payoutStatus)}>
                      {toStatusLabel(selectedWinner.payoutStatus)}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <Stepper steps={lifecycleSteps} />
                  </div>
                </div>

                <Alert
                  tone={
                    proofGuidance.tone === "success"
                      ? "success"
                      : proofGuidance.tone === "warning"
                        ? "warning"
                        : proofGuidance.tone === "danger"
                          ? "danger"
                          : "info"
                  }
                  title={proofGuidance.title}
                >
                  {proofGuidance.description}
                </Alert>

                <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Proof upload</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag in up to {effectiveDrawConfig.maxProofFiles} files, preview them,
                        replace them before submission, and then send the final proof set for
                        backend review.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openFileDialog()}
                      disabled={
                        !proofGuidance.canSubmit ||
                        draftFiles.length >= effectiveDrawConfig.maxProofFiles
                      }
                    >
                      <UploadCloud className="h-4 w-4" />
                      Add files
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  <div
                    className={`rounded-3xl border border-dashed p-6 transition-colors ${
                      isDraggingProof
                        ? "border-accent bg-accent/10"
                        : "border-border/70 bg-surface-elevated/80"
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDraggingProof(true);
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingProof(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDraggingProof(false);
                    }}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-accent/15 p-3 text-accent">
                        <FileUp className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          Drop proof files here or browse from your device
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, or PDF work well for this proof flow.
                        </p>
                      </div>
                    </div>
                  </div>

                  {draftFiles.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {draftFiles.map((item, index) => (
                        <div
                          key={item.id}
                          className="rounded-3xl border border-border/70 bg-surface-elevated/90 p-4"
                        >
                          {item.file.type.startsWith("image/") ? (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-32 w-full rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-32 items-center justify-center rounded-2xl bg-surface-soft text-muted-foreground">
                              <FileImage className="h-8 w-8" />
                            </div>
                          )}
                          <p className="mt-4 text-sm font-semibold text-foreground">
                            {item.file.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatFileSize(item.file.size)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openFileDialog(index)}
                            >
                              Replace
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDraft(item.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="accent"
                      onClick={() => void proofSubmitMutation.mutateAsync()}
                      disabled={
                        !proofGuidance.canSubmit ||
                        !draftFiles.length ||
                        proofSubmitMutation.isPending ||
                        !isOnline
                      }
                    >
                      {proofSubmitMutation.isPending ? <Spinner /> : null}
                      {proofSubmitMutation.isPending ? "Submitting..." : "Submit proof"}
                    </Button>
                    {draftFiles.length ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setDraftFiles((current) => clearProofDraftFiles({ current }))
                        }
                      >
                        Clear draft files
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Proof history</p>
                    <Badge tone={winnerProofs.length ? "info" : "muted"}>
                      {winnerProofs.length
                        ? `${winnerProofs.length} submission(s)`
                        : "No proof yet"}
                    </Badge>
                  </div>
                  {winnerProofs.length ? (
                    <div className="space-y-3">
                      {winnerProofs.map((proof) => (
                        <div
                          key={proof.id}
                          className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                Submission #{proof.submissionNumber}
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Submitted {formatDateTime(proof.submittedAt)}
                              </p>
                            </div>
                            <Badge tone={toStatusTone(proof.status)}>
                              {toStatusLabel(proof.status)}
                            </Badge>
                          </div>
                          {proof.rejectionReason?.trim() ? (
                            <p className="mt-3 text-sm text-warning">
                              Rejection reason: {proof.rejectionReason}
                            </p>
                          ) : null}
                          <div className="mt-4 space-y-2">
                            {proof.files.map((file) => (
                              <a
                                key={`${proof.id}-${file.fileUrl}-${file.fileName}`}
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface"
                              >
                                <span>{file.fileName}</span>
                                <span className="text-muted-foreground">
                                  {formatFileSize(file.sizeBytes)}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Proof submissions and review outcomes will appear here once you upload
                      supporting files.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                eyebrow="Select a record"
                title="Choose a winning result to view details"
                description="Once you select a winner record, this panel becomes the home for deadlines, proof history, rejection reasons, and payout progress."
              />
            )}
          </Card>
        </div>
      </TabPanel>
        </>
      ) : null}
    </div>
  );
};
