import { AdminPlaceholderSurface } from "@/features/admin";
import { routePaths } from "@/routes/paths";

export const AdminRevenuePage = () => {
  return (
    <AdminPlaceholderSurface
        eyebrow="Admin · Finance"
        title="Revenue, plans, subscriptions, and payment outcomes"
        description="This route is reserved for operations-heavy tooling around plans, billing state, payment ledgers, and Stripe-driven lifecycle review."
        noticeLabel="Source of truth"
        noticeTitle="Client-side success callbacks should never finalize payment state."
        noticeDescription="The admin shell keeps the webhook-first backend rule visible so future finance tooling does not drift toward brittle assumptions."
        noticeHref={routePaths.admin}
        noticeActionLabel="Return to overview"
        emptyEyebrow="Next admin surface"
        emptyTitle="Finance controls will fit cleanly here."
        emptyDescription="Use this route for plan pricing, subscription state review, failed payment triage, retry-required flows, and reconciliation-friendly reporting."
    />
  );
};
