import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScoreReviewModal } from "@/features/scores";

describe("ScoreReviewModal", () => {
  it("shows the immutable warning and confirms submission", () => {
    const onConfirm = vi.fn();

    render(
      <ScoreReviewModal
        open
        onClose={() => undefined}
        onConfirm={onConfirm}
        playedDateLabel="25 Apr 2026"
        scoreValue={18}
        isBackdated={false}
        hasDuplicateRisk={false}
        prospectiveContestNumbers={[18, 22, 31, 37, 42]}
        isOnline
      />
    );

    expect(screen.getByText(/immutable after confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/competition window preview/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm & store score/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows duplicate-risk messaging when the qualifying set would collide", () => {
    render(
      <ScoreReviewModal
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        playedDateLabel="25 Apr 2026"
        scoreValue={18}
        isBackdated={false}
        hasDuplicateRisk
        prospectiveContestNumbers={[18, 18, 31, 37, 42]}
        isOnline
      />
    );

    expect(screen.getByText(/duplicate contest number risk/i)).toBeInTheDocument();
  });
});
