import { DONATION_STATUSES } from "../charities/charities.enums.js";
import { mapDomainSubscriptionStatusToUserSubscriptionStatus } from "../subscriptions/subscription-status.mapper.js";

import {
  PAYMENT_LEDGER_DIRECTIONS,
  PAYMENT_LEDGER_ENTRY_TYPES,
  PAYMENT_STATES,
} from "./payments.enums.js";

export const mapPaymentStateToLedgerEntryType = (state) => {
  if (state === PAYMENT_STATES.SUCCEEDED) {
    return PAYMENT_LEDGER_ENTRY_TYPES.SUCCEEDED;
  }

  if (state === PAYMENT_STATES.FAILED) {
    return PAYMENT_LEDGER_ENTRY_TYPES.FAILED;
  }

  if (state === PAYMENT_STATES.CANCELED) {
    return PAYMENT_LEDGER_ENTRY_TYPES.CANCELED;
  }

  if (state === PAYMENT_STATES.TIMEOUT) {
    return PAYMENT_LEDGER_ENTRY_TYPES.TIMEOUT;
  }

  if (state === PAYMENT_STATES.RETRY_REQUIRED) {
    return PAYMENT_LEDGER_ENTRY_TYPES.RETRY_REQUIRED;
  }

  return PAYMENT_LEDGER_ENTRY_TYPES.PROCESSING;
};

export const mapPaymentLedgerDirection = (entryType) => {
  if (
    [
      PAYMENT_LEDGER_ENTRY_TYPES.INTENT_CREATED,
      PAYMENT_LEDGER_ENTRY_TYPES.PROCESSING,
      PAYMENT_LEDGER_ENTRY_TYPES.SUCCEEDED,
    ].includes(entryType)
  ) {
    return PAYMENT_LEDGER_DIRECTIONS.DEBIT;
  }

  return PAYMENT_LEDGER_DIRECTIONS.NEUTRAL;
};

export const mapDomainSubscriptionStatusToUserSubscriptionState = (
  subscriptionState,
  options = {},
) =>
  mapDomainSubscriptionStatusToUserSubscriptionStatus(
    subscriptionState,
    options,
  );

export const mapPaymentStateToDonationStatus = (state) => {
  if (state === PAYMENT_STATES.SUCCEEDED) {
    return DONATION_STATUSES.SUCCEEDED;
  }

  if (state === PAYMENT_STATES.FAILED) {
    return DONATION_STATUSES.FAILED;
  }

  if (state === PAYMENT_STATES.CANCELED) {
    return DONATION_STATUSES.CANCELLED;
  }

  if (state === PAYMENT_STATES.TIMEOUT) {
    return DONATION_STATUSES.TIMEOUT;
  }

  if (state === PAYMENT_STATES.RETRY_REQUIRED) {
    return DONATION_STATUSES.RETRY_REQUIRED;
  }

  return DONATION_STATUSES.PROCESSING;
};
