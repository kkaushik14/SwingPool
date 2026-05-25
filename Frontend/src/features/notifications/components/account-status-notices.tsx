import { Link } from "react-router-dom";

import { InlineWarningCard, TopBanner } from "@/components";

import type { AccountStatusNotice, AccountStatusSurface } from "../notifications.helpers";
import { filterStatusNoticesBySurface } from "../notifications.helpers";

const NoticeAction = ({
  href,
  actionLabel
}: {
  href?: string;
  actionLabel?: string;
}) =>
  href && actionLabel ? (
    <Link to={href} className="underline-offset-4 hover:underline">
      {actionLabel}
    </Link>
  ) : null;

export const AccountTopBanners = ({
  notices,
  limit = 2
}: {
  notices: AccountStatusNotice[];
  limit?: number;
}) => {
  const bannerNotices = filterStatusNoticesBySurface({
    notices,
    surface: "banner"
  }).slice(0, limit);

  if (!bannerNotices.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {bannerNotices.map((notice) => (
        <TopBanner
          key={notice.id}
          tone={notice.tone}
          eyebrow={notice.label}
          title={notice.title}
          description={notice.description}
          action={<NoticeAction href={notice.href} actionLabel={notice.actionLabel} />}
        />
      ))}
    </div>
  );
};

export const AccountInlineStatusCards = ({
  notices,
  surface,
  limit = 3
}: {
  notices: AccountStatusNotice[];
  surface: Exclude<AccountStatusSurface, "banner">;
  limit?: number;
}) => {
  const inlineNotices = filterStatusNoticesBySurface({
    notices,
    surface
  }).slice(0, limit);

  if (!inlineNotices.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {inlineNotices.map((notice) => (
        <InlineWarningCard
          key={notice.id}
          action={<NoticeAction href={notice.href} actionLabel={notice.actionLabel} />}
          description={notice.description}
          label={notice.label}
          title={notice.title}
          tone={notice.tone}
        />
      ))}
    </div>
  );
};
