import { AdminPlaceholderSurface } from "@/features/admin";
import { routePaths } from "@/routes/paths";

export const AdminCharitiesPage = () => {
  return (
    <AdminPlaceholderSurface
        eyebrow="Admin · Impact"
        title="Charities, allocations, and payout review"
        description="This route creates a clean future home for charity CRUD, allocation review, payout reconciliation, and immutable historical accounting visibility."
        noticeLabel="Historical integrity"
        noticeTitle="Charity changes should affect only future payment flows."
        noticeDescription="The UI guidance mirrors the backend rule that historical allocations remain immutable even when users or admins adjust future preferences."
        noticeHref={routePaths.adminAudit}
        noticeActionLabel="View audit posture"
        emptyEyebrow="Planned impact tooling"
        emptyTitle="Allocation and payout tools can expand here next."
        emptyDescription="Use this surface for charity performance, manual adjustments with reasons, payout batch review, and reporting-friendly aggregate views."
    />
  );
};
