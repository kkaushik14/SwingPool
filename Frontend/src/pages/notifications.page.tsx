import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Repeat2, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading,
  Spinner,
  Tabs
} from "@/components";
import { queryKeys } from "@/constants";
import {
  filterNotifications,
  getNotificationSummary,
  notificationFilterOptions,
  NotificationListItem,
  sortNotificationsForInbox,
  type NotificationFilterValue
} from "@/features/notifications";
import { useOnlineStatus } from "@/hooks";
import { queryClient } from "@/lib";
import { notificationsService } from "@/services";
import { pushToast } from "@/store";
import { getErrorMessage } from "@/utils";

export const NotificationsPage = () => {
  const isOnline = useOnlineStatus();
  const [activeFilter, setActiveFilter] = useState<NotificationFilterValue>("all");
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
        title: ids.length > 1 ? "Inbox updated" : "Notification updated",
        description:
          ids.length > 1
            ? "Unread items were cleared against the backend record."
            : "This notification is now marked as read."
      });
    }
  });

  const notifications = useMemo(
    () => sortNotificationsForInbox(notificationsQuery.data || []),
    [notificationsQuery.data]
  );
  const filteredNotifications = useMemo(
    () =>
      filterNotifications({
        notifications,
        filter: activeFilter
      }),
    [activeFilter, notifications]
  );
  const summary = getNotificationSummary(notifications);

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

  const unreadIds = notifications.filter((notification) => !notification.readAt).map((item) => item.id);
  const isInitialLoading = notificationsQuery.isPending && !notificationsQuery.data;
  const isHardError = notificationsQuery.isError && !notificationsQuery.data;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Notifications"
        title="Operational updates that keep account state visible, not mysterious"
        description="In-app records stay backed by the backend notification store, while the page gives you clean filters, action handling, and enough context to react confidently."
      />

      {!isOnline ? (
        <OperationalStatePanel
          action={
            <RetryButton
              isPending={notificationsQuery.isRefetching}
              label="Retry when online"
              onClick={() => void notificationsQuery.refetch()}
            />
          }
          description="You can still read anything already loaded, but new reminders and payout updates will sync after the connection returns."
          state="offline"
          title="You are offline"
        />
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={3} rows={4} /> : null}

      {isHardError ? (
        <OperationalStatePanel
          action={
            <RetryButton
              isPending={notificationsQuery.isRefetching}
              onClick={() => void notificationsQuery.refetch()}
            />
          }
          description={getErrorMessage(
            notificationsQuery.error,
            "The notification inbox could not be loaded right now."
          )}
          state="error"
          title="Notifications could not be loaded"
        />
      ) : null}

      {!isInitialLoading && !isHardError ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-surface-elevated/95">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Unread
              </p>
              <h2 className="mt-4 font-display text-3xl text-foreground">{summary.unreadCount}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                New in-app updates waiting for acknowledgement.
              </p>
            </Card>
            <Card className="bg-surface-elevated/95">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Action needed
              </p>
              <h2 className="mt-4 font-display text-3xl text-foreground">
                {summary.actionRequiredCount}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Verification, payment, expiry, or proof issues that should not get buried.
              </p>
            </Card>
            <Card className="bg-surface-elevated/95">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Billing updates
              </p>
              <h2 className="mt-4 font-display text-3xl text-foreground">{summary.billingCount}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Payment, renewal, grace, and expiry events from the backend record.
              </p>
            </Card>
            <Card className="bg-surface-elevated/95">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Draw & payout
              </p>
              <h2 className="mt-4 font-display text-3xl text-foreground">{summary.drawCount}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Draw publications, winner updates, proof outcomes, and payout confirmations.
              </p>
            </Card>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              onValueChange={(value) => setActiveFilter(value as NotificationFilterValue)}
              options={notificationFilterOptions.map((option) => ({
                ...option,
                label: option.label
              }))}
              value={activeFilter}
            />

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={!unreadIds.length || markReadMutation.isPending}
                onClick={() => void markAsRead(unreadIds)}
                variant="secondary"
              >
                {markReadMutation.isPending ? <Spinner /> : <Repeat2 className="h-4 w-4" />}
                {markReadMutation.isPending ? "Saving..." : "Mark all read"}
              </Button>
            </div>
          </div>

          {!filteredNotifications.length ? (
            <EmptyState
              description={
                activeFilter === "unread"
                  ? "Everything is currently acknowledged, so the unread queue is clear."
                  : "As backend notification events arrive, they will appear here with billing, draw, and verification context."
              }
              title={
                activeFilter === "unread"
                  ? "You are caught up"
                  : "No notifications match this view yet"
              }
              visual={
                <div className="rounded-2xl bg-primary-soft p-4 text-primary">
                  <Bell className="h-6 w-6" />
                </div>
              }
            />
          ) : (
            <div className="space-y-4">
              {summary.actionRequiredCount > 0 && activeFilter !== "unread" ? (
                <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-4 text-sm text-foreground shadow-soft">
                  <div className="rounded-2xl bg-surface-elevated/85 p-2 text-danger shadow-soft">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Important updates need attention</p>
                    <p className="mt-1 text-muted-foreground">
                      The inbox includes verification, payment, expiry, or proof items that should be reviewed before they become blockers.
                    </p>
                  </div>
                </div>
              ) : null}

              {filteredNotifications.map((notification) => (
                <NotificationListItem
                  key={notification.id}
                  isPending={pendingIds.includes(notification.id)}
                  notification={notification}
                  onMarkAsRead={(id) => void markAsRead([id])}
                />
              ))}
            </div>
          )}

          {notificationsQuery.isRefetching && notifications.length ? (
            <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-sm text-muted-foreground shadow-soft">
              <Sparkles className="h-4 w-4 text-accent" />
              Refreshing the latest notification state from the backend.
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
