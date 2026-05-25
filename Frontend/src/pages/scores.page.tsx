import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Input,
  Label,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components";
import { queryKeys } from "@/constants";
import {
  getEligibilityExplanation,
  getEligibilityReasonLabels,
  getProspectiveDuplicateValidation,
  getQualifyingScores,
  getScoreDateValidation,
  getScoreHistory,
  getTodayDateKey,
  isBackdatedScoreCandidate,
  ScoreReviewModal,
  SCORE_QUALIFYING_WINDOW_SIZE
} from "@/features/scores";
import { useOnlineStatus } from "@/hooks";
import { queryClient } from "@/lib";
import { routePaths } from "@/routes/paths";
import { scoresService } from "@/services";
import type { ScoreRecord } from "@/types";
import {
  formatDate,
  formatDateTime,
  toStatusLabel,
  toStatusTone
} from "@/utils";

const scoreSchema = z.object({
  playedDate: z
    .string()
    .min(1, "Choose the date you played.")
    .refine((value) => value <= getTodayDateKey(), {
      message: "Future played dates are not allowed."
    }),
  value: z.coerce
    .number()
    .int("Enter a whole-number score.")
    .min(1, "Score values must stay between 1 and 45.")
    .max(45, "Score values must stay between 1 and 45.")
});

type ScoreFormValues = z.infer<typeof scoreSchema>;
type ScoreFormInput = z.input<typeof scoreSchema>;

export const ScoresPage = () => {
  const isOnline = useOnlineStatus();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lastCreatedScore, setLastCreatedScore] = useState<ScoreRecord | null>(null);

  const form = useForm<ScoreFormInput, unknown, ScoreFormValues>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      playedDate: getTodayDateKey(),
      value: 18
    },
    mode: "onChange"
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.myScores,
    queryFn: async () => (await scoresService.listMine()).data
  });
  const qualifyingQuery = useQuery({
    queryKey: queryKeys.myQualifyingScores,
    queryFn: async () => (await scoresService.listQualifying()).data
  });
  const eligibilityQuery = useQuery({
    queryKey: queryKeys.scoreEligibility,
    queryFn: async () => (await scoresService.getEligibility()).data
  });

  const history = getScoreHistory(historyQuery.data || []);
  const qualifyingView = qualifyingQuery.data;
  const qualifyingScores = getQualifyingScores(qualifyingView);
  const eligibility = eligibilityQuery.data;
  const eligibilityExplanation = getEligibilityExplanation(eligibility);
  const eligibilityReasonLabels = getEligibilityReasonLabels(eligibility);

  const playedDate = form.watch("playedDate");
  const scoreValue = form.watch("value");
  const reviewedScoreValue = Number(form.getValues("value") || 0);
  const scoreDateValidation = getScoreDateValidation(playedDate);
  const candidateContestNumber =
    typeof scoreValue === "number" && Number.isFinite(scoreValue) ? scoreValue : undefined;
  const duplicateValidation = getProspectiveDuplicateValidation({
    candidateContestNumber,
    currentQualifyingScores: qualifyingScores,
    isBackdated: scoreDateValidation.isBackdated
  });
  const prospectiveWindow = duplicateValidation.prospectiveWindow;

  useEffect(() => {
    if (searchParams.get("quickEntry") === "1") {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  const createScoreMutation = useMutation({
    mutationFn: scoresService.create,
    meta: {
      toastOnError: true,
      toastTitle: "We could not store that score"
    },
    onSuccess: async (response) => {
      setLastCreatedScore(response.data);
      setReviewOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myScores }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myQualifyingScores }),
        queryClient.invalidateQueries({ queryKey: queryKeys.scoreEligibility })
      ]);
      form.reset({
        playedDate: getTodayDateKey(),
        value: 18
      });
    }
  });

  const openReview = form.handleSubmit(async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    if (duplicateValidation.hasDuplicateRisk) {
      return;
    }

    setReviewOpen(true);
  });

  const onConfirmSubmit = form.handleSubmit(async (values) => {
    await createScoreMutation.mutateAsync({
      playedDate: values.playedDate,
      value: values.value,
      contestNumber: values.value,
      metadata: {
        reviewConfirmed: true
      }
    });
  });

  const desktopHistory = useMemo(() => history, [history]);
  const mobileHistory = useMemo(() => history, [history]);
  const criticalQueries = [historyQuery, qualifyingQuery, eligibilityQuery];
  const hasCriticalData = criticalQueries.some((query) => query.data !== undefined);
  const isInitialLoading =
    criticalQueries.some((query) => query.isPending) && !hasCriticalData;
  const hasBlockingError =
    criticalQueries.some((query) => query.isError) && !hasCriticalData;
  const retryScoreQueries = async () => {
    await Promise.all(criticalQueries.map((query) => query.refetch()));
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Scores"
        title="Manage confirmed scores with a clear competition-ready view"
        description="The latest five qualifying competition scores stay separate from full immutable history, so members can understand what counts right now without losing any recorded play."
      />

      {!isOnline && hasCriticalData ? (
        <Alert tone="warning" title="Offline view">
          You can review history and eligibility, but new score submissions must wait until the
          connection returns.
        </Alert>
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={2} rows={4} /> : null}

      {!isInitialLoading && hasBlockingError ? (
        <OperationalStatePanel
          action={<RetryButton onClick={() => void retryScoreQueries()} />}
          description="Score history or eligibility details could not be loaded from the backend."
          state="error"
          title="Scores are temporarily unavailable"
        />
      ) : null}

      {!isInitialLoading && !hasBlockingError ? (
        <>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Eligibility
              </p>
              <h3 className="mt-2 font-display text-3xl text-foreground">
                {eligibilityExplanation.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {eligibilityExplanation.description}
              </p>
            </div>
            <Badge tone={eligibilityExplanation.tone}>
              {eligibility?.isEligible ? "Eligible" : "Not Eligible"}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Qualifying count
              </p>
              <p className="mt-3 font-display text-3xl text-foreground">
                {eligibility?.qualifyingCount || 0}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                of {eligibility?.rule.qualifyingWindowSize || SCORE_QUALIFYING_WINDOW_SIZE} required
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Duplicate numbers
              </p>
              <p className="mt-3 font-display text-3xl text-foreground">
                {eligibility?.duplicateContestNumbers.length || 0}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {(eligibility?.duplicateContestNumbers || []).join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Excluded from qualifying
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {(eligibility?.rule.excludedFromQualifying || []).join(", ").replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {eligibilityReasonLabels.length ? (
            <div className="space-y-3">
              {eligibilityReasonLabels.map((reason) => (
                <div
                  key={reason}
                  className="rounded-3xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
                >
                  {reason}
                </div>
              ))}
            </div>
          ) : null}

          {eligibilityExplanation.nextSteps.length ? (
            <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
              <p className="text-sm font-semibold text-foreground">Next steps</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {eligibilityExplanation.nextSteps.map((step) => (
                  <p key={step}>• {step}</p>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <div ref={formRef}>
          <Card className="space-y-6 bg-surface-elevated/95">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Score Entry
                </p>
                <h3 className="mt-2 font-display text-3xl text-foreground">
                  Enter a score, then confirm before it becomes immutable
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  User-submitted scores are confirmed and immutable immediately after
                  submission. If something needs correction later, that requires an admin
                  edit path.
                </p>
              </div>
              <Badge tone="info">Review required</Badge>
            </div>

            {lastCreatedScore ? (
              <Alert tone="success" title="Score stored and confirmed">
                Contest number {lastCreatedScore.contestNumber} was saved. Because this is a
                user submission, it is now immutable.
              </Alert>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <form className="space-y-5" onSubmit={(event) => void openReview(event)}>
                <div>
                  <Label htmlFor="playedDate">Played date</Label>
                  <Input id="playedDate" type="date" {...form.register("playedDate")} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Future dates are blocked. A date earlier than today will be stored as
                    backdated and excluded from competition eligibility.
                  </p>
                  {form.formState.errors.playedDate ? (
                    <p className="mt-2 text-sm text-danger">
                      {form.formState.errors.playedDate.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="value">Score value / contest number</Label>
                  <Input
                    id="value"
                    type="number"
                    min={1}
                    max={45}
                    {...form.register("value", { valueAsNumber: true })}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Allowed range is 1 to 45. Under the current rules, the score value
                    becomes the contest number.
                  </p>
                  {form.formState.errors.value ? (
                    <p className="mt-2 text-sm text-danger">
                      {form.formState.errors.value.message}
                    </p>
                  ) : null}
                </div>

                {scoreDateValidation.isBackdated ? (
                  <Alert
                    tone="warning"
                    title="Backdated scores stay stored but not competition-eligible"
                  >
                    This played date is earlier than your local submission date, so the
                    score will be kept in history but excluded from the qualifying competition
                    set.
                  </Alert>
                ) : null}

                {duplicateValidation.hasDuplicateRisk ? (
                  <Alert tone="danger" title="Duplicate contest number detected">
                    Submitting {candidateContestNumber} now would create duplicate contest
                    numbers inside the latest qualifying competition window:{" "}
                    {duplicateValidation.duplicates.join(", ")}.
                  </Alert>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={createScoreMutation.isPending || !isOnline}
                  >
                    {createScoreMutation.isPending ? <Spinner /> : null}
                    Review submission
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      form.reset({
                        playedDate: getTodayDateKey(),
                        value: 18
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>
              </form>

              <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    Prospective qualifying effect
                  </p>
                  <Badge tone={scoreDateValidation.isBackdated ? "warning" : "accent"}>
                    {scoreDateValidation.isBackdated ? "Stored only" : "Qualifying preview"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  This preview shows how the latest qualifying window would look if the
                  candidate score were confirmed right now.
                </p>

                <div className="flex flex-wrap gap-3">
                  {prospectiveWindow.map((score, index) => (
                    <div
                      key={`${score.id}-${index}`}
                      className="rounded-pill border border-border bg-surface-elevated px-4 py-3 font-display text-xl text-foreground shadow-soft"
                    >
                      {score.contestNumber}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-surface-elevated/80 p-4 text-sm text-muted-foreground">
                  <p>
                    Current qualifying set counts only active, non-backdated scores and is
                    ordered by latest submission first.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Competition scores
              </p>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                Latest five qualifying scores
              </h3>
            </div>
            <Badge tone={eligibility?.isEligible ? "success" : "warning"}>
              {eligibility?.qualifyingCount || 0}/{eligibility?.rule.qualifyingWindowSize || SCORE_QUALIFYING_WINDOW_SIZE}
            </Badge>
          </div>

          {qualifyingScores.length ? (
            <div className="space-y-3">
              {qualifyingScores.map((score, index) => (
                <div
                  key={score.id}
                  className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Badge tone="accent">Slot {index + 1}</Badge>
                        <p className="font-semibold text-foreground">
                          Contest #{score.contestNumber}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Played {formatDate(score.playedDate)} • Submitted {formatDateTime(score.submittedAt)}
                      </p>
                    </div>
                    <Badge tone={toStatusTone(score.status)}>
                      {toStatusLabel(score.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="No qualifying window yet"
              title="Your latest qualifying five will appear here"
              description="Backdated or non-active scores stay in history, but only active non-backdated submissions can enter the competition set."
            />
          )}
        </Card>

        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Full history
              </p>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                Every stored score, even when it does not qualify
              </h3>
            </div>
            <Badge tone="info">{history.length} total</Badge>
          </div>

          {desktopHistory.length ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Played</TableHeaderCell>
                      <TableHeaderCell>Value</TableHeaderCell>
                      <TableHeaderCell>Contest</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Submission</TableHeaderCell>
                      <TableHeaderCell>Notes</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {desktopHistory.map((score) => (
                      <TableRow key={score.id}>
                        <TableCell>{formatDate(score.playedDate)}</TableCell>
                        <TableCell>{score.value}</TableCell>
                        <TableCell>{score.contestNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={toStatusTone(score.status)}>
                              {toStatusLabel(score.status)}
                            </Badge>
                            {score.isBackdated ? <Badge tone="warning">Stored only</Badge> : null}
                            <Badge tone="info">Immutable</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(score.submittedAt)}</TableCell>
                        <TableCell className="max-w-[260px]">
                          {score.isBackdated
                            ? "Backdated scores are stored in history but excluded from competition."
                            : "Confirmed user submission; immutable after storage."}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4 md:hidden">
                {mobileHistory.map((score) => (
                  <div key={score.id} className="relative rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
                    <div className="absolute left-4 top-5 h-full border-l border-border/70" />
                    <div className="relative pl-6">
                      <div className="absolute left-[-2px] top-1 h-3 w-3 rounded-full bg-accent" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={toStatusTone(score.status)}>{toStatusLabel(score.status)}</Badge>
                        {score.isBackdated ? <Badge tone="warning">Stored only</Badge> : null}
                        <Badge tone="info">Immutable</Badge>
                      </div>
                      <p className="mt-3 font-semibold text-foreground">
                        Score {score.value} • Contest #{score.contestNumber}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Played {formatDate(score.playedDate)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Confirmed {formatDateTime(score.confirmedAt || score.submittedAt)}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {score.isBackdated
                          ? "Stored in full history, but not eligible for competition."
                          : "Confirmed and immutable after submission."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              eyebrow="No score history yet"
              title="Your full score history will appear here"
              description="Every recorded submission stays in the database, even when it is backdated or otherwise excluded from competition qualification."
            />
          )}
        </Card>
      </div>

      <ScoreReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onConfirm={() => void onConfirmSubmit()}
        isPending={createScoreMutation.isPending}
        isOnline={isOnline}
        playedDateLabel={formatDate(form.getValues("playedDate"))}
        scoreValue={reviewedScoreValue}
        isBackdated={isBackdatedScoreCandidate(form.getValues("playedDate"))}
        hasDuplicateRisk={duplicateValidation.hasDuplicateRisk}
        prospectiveContestNumbers={prospectiveWindow.map((score) => score.contestNumber)}
      />

      <div className="flex justify-start">
        <ButtonLink to={routePaths.app} variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
        </>
      ) : null}
    </div>
  );
};
