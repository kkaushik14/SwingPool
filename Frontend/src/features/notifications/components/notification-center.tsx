import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Drawer,
  EmptyState,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton
} from "@/components";
import { queryKeys } from "@/constants";
import { useOnlineStatus } from "@/hooks";
import { queryClient } from "@/lib";
import { routePaths } from "@/routes/paths";
import { notificationsService } from "@/services";
import { pushToast } from "@/store";
import { getErrorMessage } from "@/utils";

import { NotificationListItem } from "./notification-list-item";
import {
  getNotificationSummary,
  selectNotificationsPreview,
  sortNotificationsForInbox
} from "../notifications.helpers";

const unreadCountClassNames =
  "absolute -right-1 -top-1 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-soft";

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => (await notificationsService.listMine()).data
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) =>
      Promise.all(
        ids.map((id) =>
          notificationsService.update(id, {
            readAt: new Date().toISOString()
          })
        )
      ),
    onSuccess: async (_response, ids) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });

      pushToast({
        tone: "success",
        title: ids.length > 1 ? "Notifications updated" : "Notification marked as read",
        description:
          ids.length > 1
            ? "Your inbox reflects the latest read state from the backend."
            : "This item has been cleared from the unread list."
      });
    }
  });

  const sortedNotifications = useMemo(
    () => sortNotificationsForInbox(notificationsQuery.data || []),
    [notificationsQuery.data]
  );
  const previewNotifications = useMemo(
    () => selectNotificationsPreview(sortedNotifications, 6),
    [sortedNotifications]
  );
  const summary = getNotificationSummary(sortedNotifications);

  const markAsRead = async (ids: string[]) => {
    if (!ids.length) {
      return;
    }

    setPendingIds((current) => [...new Set([...current, ...ids])]);

    try {
      await markReadMutation.mutateAsync(ids);
    } finally {
      setPendingIds((current) => current.filter((id) => !ids.includes(id)));
    }
  };

  return (
    <>
      <Button
        aria-label="Open notifications center"
        className="relative"
        onClick={() => setOpen(true)}
        size="icon"
        variant="secondary"
      >
        {summary.unreadCount ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {summary.unreadCount ? (
          <span className={unreadCountClassNames}>
            {summary.unreadCount > 9 ? "9+" : summary.unreadCount}
          </span>
        ) : null}
      </Button>

      <Drawer
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              disabled={!summary.unreadCount || markReadMutation.isPending}
              onClick={() =>
                void markAsRead(sortedNotifications.filter((item) => !item.readAt).map((item) => item.id))
              }
              variant="secondary"
            >
              Mark all read
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                navigate(routePaths.notifications);
              }}
            >
              Open notifications hub
            </Button>
          </div>
        }
        onClose={() => setOpen(false)}
        open={open}
        title="Notifications"
      >
        <div className="space-y-4">
          {!isOnline && !notificationsQuery.data?.length ? (
            <OperationalStatePanel
              compact
              description="Reconnect to sync the latest notification records from the backend."
              state="offline"
              title="You are offline"
            />
          ) : null}

          {notificationsQuery.isPending && !notificationsQuery.data ? (
            <PageSectionSkeleton cards={1} rows={3} />
          ) : null}

          {notificationsQuery.isError && !notificationsQuery.data ? (
            <OperationalStatePanel
              compact
              action={
                <RetryButton
                  isPending={notificationsQuery.isRefetching}
                  onClick={() => void notificationsQuery.refetch()}
                />
              }
              description={getErrorMessage(
                notificationsQuery.error,
                "The inbox could not load right now."
              )}
              state="error"
              title="Notifications could not be loaded"
            />
          ) : null}

          {!notificationsQuery.isPending &&
          !notificationsQuery.isError &&
          !previewNotifications.length ? (
            <EmptyState
              description="When reminders, billing updates, draw outcomes, and payout messages arrive, they will show up here first."
              title="Your in-app inbox is quiet right now"
            />
          ) : null}

          {previewNotifications.map((notification) => (
            <NotificationListItem
              key={notification.id}
              compact
              isPending={pendingIds.includes(notification.id)}
              notification={notification}
              onMarkAsRead={(id) => void markAsRead([id])}
            />
          ))}
        </div>
      </Drawer>
    </>
  );
};
