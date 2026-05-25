import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlanCard } from "@/features/subscriptions";

const plan = {
  id: "plan-quarterly",
  code: "quarterly",
  name: "Quarterly",
  description: "Most popular billing rhythm.",
  priceInr: 499,
  billingCycleDays: 90,
  hierarchyLevel: 2,
  currency: "INR"
} as const;

describe("PlanCard", () => {
  it("calls onSelect when the member chooses a plan", () => {
    const onSelect = vi.fn();

    render(<PlanCard plan={plan} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /choose plan/i }));

    expect(onSelect).toHaveBeenCalledWith(plan);
  });

  it("shows selected state clearly", () => {
    render(<PlanCard plan={plan} selected />);

    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /selected for checkout/i })
    ).toBeInTheDocument();
  });
});
