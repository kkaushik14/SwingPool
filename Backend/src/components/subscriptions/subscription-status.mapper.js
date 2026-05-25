import { SUBSCRIPTION_STATUSES as USER_SUBSCRIPTION_STATUSES } from "../../enums/index.js";

import { SUBSCRIPTION_STATUSES as DOMAIN_SUBSCRIPTION_STATUSES } from "./subscriptions.enums.js";

export const mapDomainSubscriptionStatusToUserSubscriptionStatus = (
  subscriptionStatus,
  { pendingPaymentAsPastDue = false } = {},
) => {
  if (subscriptionStatus === DOMAIN_SUBSCRIPTION_STATUSES.ACTIVE) {
    return USER_SUBSCRIPTION_STATUSES.ACTIVE;
  }

  const pastDueStatuses = [
    DOMAIN_SUBSCRIPTION_STATUSES.GRACE_PERIOD,
    DOMAIN_SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
  ];

  if (pendingPaymentAsPastDue) {
    pastDueStatuses.push(DOMAIN_SUBSCRIPTION_STATUSES.PENDING_PAYMENT);
  }

  if (pastDueStatuses.includes(subscriptionStatus)) {
    return USER_SUBSCRIPTION_STATUSES.PAST_DUE;
  }

  if (
    [
      DOMAIN_SUBSCRIPTION_STATUSES.CANCELED,
      DOMAIN_SUBSCRIPTION_STATUSES.EXPIRED,
    ].includes(subscriptionStatus)
  ) {
    return USER_SUBSCRIPTION_STATUSES.CANCELED;
  }

  return USER_SUBSCRIPTION_STATUSES.FREE;
};
