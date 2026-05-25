import { Badge, Button, Card, Spinner } from "@/components";
import type { NotificationRecord } from "@/types";

import {
  formatNotificationTimestamp,
  getNotificationEventMeta
} from "../notifications.helpers";

export const NotificationListItem = ({
  notification,
  compact = false,
  isPending = false,
  onMarkAsRead
}: {
  notification: NotificationRecord;
  compact?: boolean;
  isPending?: boolean;
  onMarkAsRead?: (id: string) => void;
}) => {
  const meta = getNotificationEventMeta(notification.eventType);

  return (
    <Card
      className={
        compact
          ? "space-y-3 rounded-2xl bg-surface-elevated/95 p-4"
          : "space-y-4 bg-surface-elevated/95"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {!notification.readAt ? <Badge tone="accent">New</Badge> : null}
        <Badge tone="muted">{meta.category}</Badge>
      </div>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{notification.title}</p>
            <p className="text-sm leading-7 text-muted-foreground">{notification.message}</p>
          </div>
          {!notification.readAt && onMarkAsRead ? (
            <Button
              disabled={isPending}
              onClick={() => onMarkAsRead(notification.id)}
              size={compact ? "sm" : "md"}
              variant="secondary"
            >
              {isPending ? <Spinner /> : null}
              {isPending ? "Saving..." : "Mark read"}
            </Button>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <span>{formatNotificationTimestamp(notification.createdAt)}</span>
          {notification.channel ? <span>{notification.channel.replace(/_/g, " ")}</span> : null}
        </div>
      </div>
    </Card>
  );
};
