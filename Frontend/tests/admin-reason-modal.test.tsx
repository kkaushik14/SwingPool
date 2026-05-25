import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminReasonModal } from "@/features/admin";

describe("AdminReasonModal", () => {
  it("requires a substantial reason before enabling confirmation", () => {
    const onConfirm = vi.fn();

    render(
      <AdminReasonModal
        open
        title="Publish draw"
        description="Sensitive actions require a reason."
        reason=""
        confirmLabel="Publish"
        onReasonChange={() => undefined}
        onClose={() => undefined}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole("button", { name: /publish/i })).toBeDisabled();
  });

  it("calls confirm when a valid reason is present", () => {
    const onConfirm = vi.fn();

    render(
      <AdminReasonModal
        open
        title="Publish draw"
        description="Sensitive actions require a reason."
        reason="Reviewed the final simulated result and approval trail."
        confirmLabel="Publish"
        onReasonChange={() => undefined}
        onClose={() => undefined}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /publish/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
