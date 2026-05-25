import { toISTDateTimeString } from "../../utils/index.js";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
} from "./notifications.enums.js";

const defaultChannels = [
  NOTIFICATION_CHANNELS.IN_APP,
  NOTIFICATION_CHANNELS.EMAIL,
];

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  return toISTDateTimeString(value);
};

const formatAmount = ({ amountMajor, currency = "INR" }) => {
  if (amountMajor === undefined || amountMajor === null || amountMajor === "") {
    return currency;
  }

  return `${currency.toUpperCase()} ${amountMajor}`;
};

const templateBuilders = {
  [NOTIFICATION_EVENT_TYPES.SIGNUP_VERIFICATION]: ({ context = {}, user }) => ({
    title: "Verify your account",
    subject: "Complete your Swing Pool signup verification",
    message:
      `Hi ${user?.displayName || "there"}, please verify your email to activate your account. ${
        context.expiresAt
          ? `Verification token expires at ${formatDateTime(context.expiresAt)} IST.`
          : ""
      }`.trim(),
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.PAYMENT_SUCCESS]: ({ context = {} }) => ({
    title: "Payment successful",
    subject: "Your payment was confirmed",
    message: `Your payment of ${formatAmount({
      amountMajor: context.amountMajor,
      currency: context.currency || "INR",
    })} was successful.`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.PAYMENT_FAILURE]: ({ context = {} }) => ({
    title: "Payment failed",
    subject: "Payment update: action required",
    message: `Your payment ${
      context.amountMajor
        ? `for ${formatAmount({
            amountMajor: context.amountMajor,
            currency: context.currency || "INR",
          })} `
        : ""
    }did not complete. Reason: ${context.reason || "unknown"}.`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.RENEWAL_REMINDER]: ({ context = {} }) => ({
    title: "Renewal reminder",
    subject: "Upcoming subscription renewal",
    message: `Your subscription ${
      context.planName ? `(${context.planName}) ` : ""
    }is scheduled for renewal on ${formatDateTime(context.nextBillingAt)} IST.`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.GRACE_PERIOD_WARNING]: ({ context = {} }) => ({
    title: "Grace period warning",
    subject: "Subscription grace period notice",
    message: `Your subscription is in grace period and will expire on ${formatDateTime(
      context.gracePeriodEndsAt,
    )} IST unless payment is settled.`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.SUBSCRIPTION_EXPIRY]: ({ context = {} }) => ({
    title: "Subscription expired",
    subject: "Subscription expiry update",
    message: `Your subscription expired on ${formatDateTime(
      context.expiredAt,
    )} IST.`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.DRAW_PUBLISHED]: ({ context = {} }) => ({
    title: "Draw published",
    subject: "Monthly draw results are live",
    message: `Draw results for ${context.drawMonthKey || "this month"} are now published.${
      Array.isArray(context.winningNumbers) && context.winningNumbers.length > 0
        ? ` Winning numbers: ${context.winningNumbers.join(", ")}.`
        : ""
    }`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.WINNER_SELECTED]: ({ context = {} }) => ({
    title: "Winner selected",
    subject: "You have a winning entry",
    message: `You have been selected as a winner (${context.matchCount || "?"} matches). Submit proof before ${formatDateTime(
      context.verificationDeadlineAt,
    )} IST.`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.PROOF_REJECTED]: ({ context = {} }) => ({
    title: "Proof rejected",
    subject: "Winner proof review update",
    message: `Your winner proof was rejected.${
      context.rejectionReason ? ` Reason: ${context.rejectionReason}.` : ""
    }`,
    channels: defaultChannels,
  }),
  [NOTIFICATION_EVENT_TYPES.PAYOUT_COMPLETED]: ({ context = {} }) => ({
    title: "Payout completed",
    subject: "Winner payout completed",
    message: `Your payout of ${formatAmount({
      amountMajor: context.amountMajor,
      currency: context.currency || "INR",
    })} has been completed.`,
    channels: defaultChannels,
  }),
};

export const buildNotificationTemplate = ({
  eventType,
  context = {},
  user = null,
}) => {
  const builder = templateBuilders[eventType];

  if (!builder) {
    return {
      title: "Notification",
      subject: "Swing Pool notification",
      message: context.message || "You have a new account update.",
      channels: defaultChannels,
    };
  }

  return builder({ context, user });
};
