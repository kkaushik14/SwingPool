import { Alert, Button, Modal, Spinner } from "@/components";

export const ScoreReviewModal = ({
  open,
  onClose,
  onConfirm,
  isPending,
  isOnline,
  playedDateLabel,
  scoreValue,
  isBackdated,
  hasDuplicateRisk,
  prospectiveContestNumbers
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  isOnline?: boolean;
  playedDateLabel: string;
  scoreValue: number;
  isBackdated: boolean;
  hasDuplicateRisk: boolean;
  prospectiveContestNumbers: number[];
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Review score submission"
    description="This is the final confirmation step before the score is stored as an immutable user submission."
    footer={
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onClose}>
          Edit score
        </Button>
        <Button
          variant="accent"
          disabled={isPending || !isOnline}
          onClick={onConfirm}
        >
          {isPending ? <Spinner /> : null}
          {isPending ? "Confirming..." : "Confirm & store score"}
        </Button>
      </div>
    }
  >
    <div className="space-y-4">
      <Alert tone="warning" title="Immutable after confirmation">
        Once you confirm this user submission, it becomes immutable. Admins can still correct
        records later, but the member submission itself is locked.
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Played date
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">{playedDateLabel}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Score value
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">{scoreValue}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Contest number
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">{scoreValue}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Competition effect
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {isBackdated ? "Stored but excluded" : "Can affect the qualifying window"}
          </p>
        </div>
      </div>

      {isBackdated ? (
        <Alert tone="info" title="Backdated handling">
          This score will remain visible in full history, but it will not enter the latest five
          qualifying competition scores because the played date is earlier than today.
        </Alert>
      ) : null}

      {hasDuplicateRisk ? (
        <Alert tone="danger" title="Duplicate contest number risk">
          This submission would create duplicate contest numbers in the latest five qualifying
          set, so the backend is expected to reject it.
        </Alert>
      ) : (
        <Alert tone="success" title="Competition window preview">
          If you confirm now, the latest qualifying competition set would use these contest
          numbers: {prospectiveContestNumbers.join(", ")}.
        </Alert>
      )}
    </div>
  </Modal>
);
