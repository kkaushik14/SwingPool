import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotificationListItem } from "@/features/notifications/components/notification-list-item";

describe("NotificationListItem", () => {
  it("renders unread notifications with action metadata and mark-read control", () => {
    const onMarkAsRead = vi.fn();

    render(
      <NotificationListItem
        notification={{
          id: "notification-1",
          title: "Payment failed",
          message: "Please update your billing.",
          eventType: "payment_failure",
          createdAt: "2026-04-25T10:00:00.000Z"
        }}
        onMarkAsRead={onMarkAsRead}
      />
    );

    expect(screen.getByText("Payment failed")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mark read/i }));

    expect(onMarkAsRead).toHaveBeenCalledWith("notification-1");
  });
});
