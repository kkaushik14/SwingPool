import { describe, expect, it } from "vitest";

import { DONATION_STATUSES } from "../src/components/charities/charities.enums.js";
import {
  mapDomainSubscriptionStatusToUserSubscriptionState,
  mapPaymentLedgerDirection,
  mapPaymentStateToDonationStatus,
  mapPaymentStateToLedgerEntryType,
} from "../src/components/payments/payments.mappers.js";
import {
  PAYMENT_LEDGER_DIRECTIONS,
  PAYMENT_LEDGER_ENTRY_TYPES,
  PAYMENT_STATES,
} from "../src/components/payments/payments.enums.js";
import { SUBSCRIPTION_STATUSES as DOMAIN_SUBSCRIPTION_STATUSES } from "../src/components/subscriptions/subscriptions.enums.js";
import { mapDomainSubscriptionStatusToUserSubscriptionStatus } from "../src/components/subscriptions/subscription-status.mapper.js";
import { SUBSCRIPTION_STATUSES as USER_SUBSCRIPTION_STATUSES } from "../src/enums/index.js";

describe("Centralized Domain Rule Mappers", () => {
  it("maps subscription domain statuses to user subscription statuses", () => {
    expect(
      mapDomainSubscriptionStatusToUserSubscriptionStatus(
        DOMAIN_SUBSCRIPTION_STATUSES.ACTIVE,
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.ACTIVE);

    expect(
      mapDomainSubscriptionStatusToUserSubscriptionStatus(
        DOMAIN_SUBSCRIPTION_STATUSES.GRACE_PERIOD,
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.PAST_DUE);

    expect(
      mapDomainSubscriptionStatusToUserSubscriptionStatus(
        DOMAIN_SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.PAST_DUE);

    expect(
      mapDomainSubscriptionStatusToUserSubscriptionStatus(
        DOMAIN_SUBSCRIPTION_STATUSES.CANCELED,
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.CANCELED);

    expect(
      mapDomainSubscriptionStatusToUserSubscriptionStatus(
        DOMAIN_SUBSCRIPTION_STATUSES.EXPIRED,
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.CANCELED);

    expect(
      mapDomainSubscriptionStatusToUserSubscriptionStatus(
        DOMAIN_SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.FREE);
  });

  it("supports treating pending_payment as past_due in payment reconciliation paths", () => {
    expect(
      mapDomainSubscriptionStatusToUserSubscriptionState(
        DOMAIN_SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
        { pendingPaymentAsPastDue: true },
      ),
    ).toBe(USER_SUBSCRIPTION_STATUSES.PAST_DUE);
  });

  it("maps payment states to immutable ledger entry types and directions", () => {
    expect(mapPaymentStateToLedgerEntryType(PAYMENT_STATES.SUCCEEDED)).toBe(
      PAYMENT_LEDGER_ENTRY_TYPES.SUCCEEDED,
    );
    expect(mapPaymentStateToLedgerEntryType(PAYMENT_STATES.FAILED)).toBe(
      PAYMENT_LEDGER_ENTRY_TYPES.FAILED,
    );
    expect(mapPaymentStateToLedgerEntryType(PAYMENT_STATES.CANCELED)).toBe(
      PAYMENT_LEDGER_ENTRY_TYPES.CANCELED,
    );
    expect(mapPaymentStateToLedgerEntryType(PAYMENT_STATES.TIMEOUT)).toBe(
      PAYMENT_LEDGER_ENTRY_TYPES.TIMEOUT,
    );
    expect(
      mapPaymentStateToLedgerEntryType(PAYMENT_STATES.RETRY_REQUIRED),
    ).toBe(PAYMENT_LEDGER_ENTRY_TYPES.RETRY_REQUIRED);
    expect(mapPaymentStateToLedgerEntryType("unknown")).toBe(
      PAYMENT_LEDGER_ENTRY_TYPES.PROCESSING,
    );

    expect(
      mapPaymentLedgerDirection(PAYMENT_LEDGER_ENTRY_TYPES.INTENT_CREATED),
    ).toBe(PAYMENT_LEDGER_DIRECTIONS.DEBIT);
    expect(
      mapPaymentLedgerDirection(PAYMENT_LEDGER_ENTRY_TYPES.SUCCEEDED),
    ).toBe(PAYMENT_LEDGER_DIRECTIONS.DEBIT);
    expect(mapPaymentLedgerDirection(PAYMENT_LEDGER_ENTRY_TYPES.FAILED)).toBe(
      PAYMENT_LEDGER_DIRECTIONS.NEUTRAL,
    );
  });

  it("maps payment states to donation statuses for charity accounting sync", () => {
    expect(mapPaymentStateToDonationStatus(PAYMENT_STATES.SUCCEEDED)).toBe(
      DONATION_STATUSES.SUCCEEDED,
    );
    expect(mapPaymentStateToDonationStatus(PAYMENT_STATES.FAILED)).toBe(
      DONATION_STATUSES.FAILED,
    );
    expect(mapPaymentStateToDonationStatus(PAYMENT_STATES.CANCELED)).toBe(
      DONATION_STATUSES.CANCELLED,
    );
    expect(mapPaymentStateToDonationStatus(PAYMENT_STATES.TIMEOUT)).toBe(
      DONATION_STATUSES.TIMEOUT,
    );
    expect(mapPaymentStateToDonationStatus(PAYMENT_STATES.RETRY_REQUIRED)).toBe(
      DONATION_STATUSES.RETRY_REQUIRED,
    );
    expect(mapPaymentStateToDonationStatus("unknown")).toBe(
      DONATION_STATUSES.PROCESSING,
    );
  });
});
