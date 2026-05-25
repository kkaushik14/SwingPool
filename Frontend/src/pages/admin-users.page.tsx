import { AdminPlaceholderSurface } from "@/features/admin";
import { routePaths } from "@/routes/paths";

export const AdminUsersPage = () => {
  return (
    <AdminPlaceholderSurface
        eyebrow="Admin · Members"
        title="Users and verification queues"
        description="This route is ready to grow into the member operations surface for lifecycle review, profile verification, suspensions, and role-safe admin actions."
        noticeLabel="Guardrail"
        noticeTitle="Profile decisions should stay backed by reasoned manual actions."
        noticeDescription="The frontend keeps this note prominent because verification and suspension changes carry audit and eligibility consequences."
        noticeHref={routePaths.adminAudit}
        noticeActionLabel="Review safeguards"
        emptyEyebrow="Planned admin tooling"
        emptyTitle="Member review tools can slot into this surface next."
        emptyDescription="Use this route for verification queues, account states, bootstrap credential notices, and other user-centric operations without mixing them into the member workspace."
    />
  );
};
