import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PaymentStatusPanel } from "@/features/subscriptions";

describe("PaymentStatusPanel", () => {
  it("renders backend-confirmed success state details", () => {
    render(
      <MemoryRouter>
        <PaymentStatusPanel
          state={{
            kind: "success",
            title: "Payment confirmed",
            description: "The backend confirmed the final payment state."
          }}
          payment={{
            id: "payment-1",
            userId: "user-1",
            amount: 27800,
            currency: "inr",
            stripePaymentIntentId: "pi_123",
            state: "succeeded"
          }}
          subscription={{
            id: "sub-1",
            userId: "user-1",
            planCode: "quarterly",
            planNameSnapshot: "Quarterly",
            planPriceInrSnapshot: 499,
            status: "active"
          }}
          pricingSummary={[
            {
              label: "Plan",
              value: "₹499.00"
            }
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Payment confirmed")).toBeInTheDocument();
    expect(screen.getByText("The backend confirmed the final payment state.")).toBeInTheDocument();
    expect(screen.getByText("Payment record total")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to billing/i })).toBeInTheDocument();
  });
});
