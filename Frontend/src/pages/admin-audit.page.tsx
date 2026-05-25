import { AdminPlaceholderSurface } from "@/features/admin";
import { routePaths } from "@/routes/paths";

export const AdminAuditPage = () => {
  return (
    <AdminPlaceholderSurface
        eyebrow="Admin · Audit"
        title="Audit trails, summaries, and operational reports"
        description="This route is the reporting-friendly surface for request ids, manual override reasons, and cross-domain summaries that should stay export-ready later."
        noticeLabel="Audit discipline"
        noticeTitle="Sensitive overrides should always include actor, reason, and before/after context."
        noticeDescription="Keeping that language in the shell helps future tools stay aligned with the backend audit model instead of treating overrides like casual edits."
        noticeHref={routePaths.adminRevenue}
        noticeActionLabel="Open finance surface"
        emptyEyebrow="Report shell"
        emptyTitle="Operational reports can expand here."
        emptyDescription="Use this route for filterable summaries, audit streams, and export-ready report groupings without changing the surrounding admin shell."
    />
  );
};
