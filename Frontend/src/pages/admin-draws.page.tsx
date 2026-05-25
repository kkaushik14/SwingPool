import { AdminPlaceholderSurface } from "@/features/admin";
import { routePaths } from "@/routes/paths";

export const AdminDrawsPage = () => {
  return (
    <AdminPlaceholderSurface
        eyebrow="Admin · Operations"
        title="Draw operations, winner proofing, and payout readiness"
        description="This route is prepared for simulations, publication workflows, jackpot handling, proof review, and winner payout progression."
        noticeLabel="Immutability"
        noticeTitle="Published draw results must remain stable once released."
        noticeDescription="The admin shell keeps that rule front and center so future tools distinguish clearly between simulation, preparation, and irreversible publication."
        noticeHref={routePaths.admin}
        noticeActionLabel="Open admin overview"
        emptyEyebrow="Next operations surface"
        emptyTitle="Draw tooling can expand here without reshaping the shell."
        emptyDescription="Use this route for month-end preparation, execution checks, result publication, proof deadlines, and payout workflow review."
    />
  );
};
