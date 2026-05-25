import { Link } from "react-router-dom";

import { EmptyState, InlineWarningCard, SectionHeading } from "@/components";

export const AdminPlaceholderSurface = ({
  eyebrow,
  title,
  description,
  noticeLabel,
  noticeTitle,
  noticeDescription,
  noticeHref,
  noticeActionLabel,
  emptyEyebrow,
  emptyTitle,
  emptyDescription
}: {
  eyebrow: string;
  title: string;
  description: string;
  noticeLabel: string;
  noticeTitle: string;
  noticeDescription: string;
  noticeHref: string;
  noticeActionLabel: string;
  emptyEyebrow: string;
  emptyTitle: string;
  emptyDescription: string;
}) => {
  return (
    <div className="space-y-8">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />

      <InlineWarningCard
        label={noticeLabel}
        title={noticeTitle}
        description={noticeDescription}
        action={
          <Link to={noticeHref} className="underline-offset-4 hover:underline">
            {noticeActionLabel}
          </Link>
        }
      />

      <EmptyState
        eyebrow={emptyEyebrow}
        title={emptyTitle}
        description={emptyDescription}
      />
    </div>
  );
};
