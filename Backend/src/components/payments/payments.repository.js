import { PaymentModel } from "./payments.model.js";
import { PaymentLedgerModel } from "./payments-ledger.model.js";
import { PaymentWebhookEventModel } from "./payments-webhook-event.model.js";

export const paymentsRepository = {
  async create(payload) {
    return PaymentModel.create(payload);
  },

  async listByUserId(userId) {
    return PaymentModel.find({ userId }).sort({ createdAt: -1 });
  },

  async findByIntentId(stripePaymentIntentId) {
    return PaymentModel.findOne({ stripePaymentIntentId });
  },

  async findByCheckoutSessionId(stripeCheckoutSessionId) {
    return PaymentModel.findOne({ stripeCheckoutSessionId });
  },

  async findById(paymentId) {
    return PaymentModel.findById(paymentId);
  },

  async updateByIntentId(stripePaymentIntentId, updatePayload) {
    return PaymentModel.findOneAndUpdate(
      { stripePaymentIntentId },
      updatePayload,
      {
        new: true,
        runValidators: true,
      },
    );
  },

  async updateById(paymentId, updatePayload) {
    return PaymentModel.findByIdAndUpdate(paymentId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async findTimedOutCandidates(at) {
    return PaymentModel.find({
      state: {
        $in: ["processing", "retry_required"],
      },
      timeoutAt: {
        $lte: at,
      },
    }).sort({ timeoutAt: 1 });
  },

  async findReconciliationCandidates({
    states = ["processing", "retry_required", "timeout"],
    updatedBefore = new Date(),
    limit = 100,
  } = {}) {
    return PaymentModel.find({
      state: {
        $in: states,
      },
      stripePaymentIntentId: {
        $exists: true,
        $ne: "",
      },
      updatedAt: {
        $lte: updatedBefore,
      },
    })
      .sort({ updatedAt: 1 })
      .limit(limit);
  },

  async createLedgerEntry(payload) {
    return PaymentLedgerModel.create(payload);
  },

  async findLedgerEntryByIdempotencyKey(idempotencyKey) {
    return PaymentLedgerModel.findOne({ idempotencyKey });
  },

  async listLedgerByPaymentId(paymentId) {
    return PaymentLedgerModel.find({ paymentId }).sort({
      occurredAt: 1,
      createdAt: 1,
    });
  },

  async listLedgerByUserId(userId) {
    return PaymentLedgerModel.find({ userId }).sort({
      occurredAt: -1,
      createdAt: -1,
    });
  },

  async createWebhookEvent(payload) {
    return PaymentWebhookEventModel.create(payload);
  },

  async findWebhookEventByStripeEventId(stripeEventId) {
    return PaymentWebhookEventModel.findOne({ stripeEventId });
  },

  async markWebhookEventProcessing(webhookEventId, metadata = {}) {
    return PaymentWebhookEventModel.findByIdAndUpdate(
      webhookEventId,
      {
        $set: {
          status: "processing",
          lastReceivedAt: new Date(),
          metadata,
          processingError: "",
        },
        $inc: {
          processingAttempts: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
  },

  async markWebhookEventProcessed(webhookEventId, metadata = {}) {
    return PaymentWebhookEventModel.findByIdAndUpdate(
      webhookEventId,
      {
        status: "processed",
        processedAt: new Date(),
        lastReceivedAt: new Date(),
        processingError: "",
        metadata,
      },
      {
        new: true,
        runValidators: true,
      },
    );
  },

  async markWebhookEventIgnored(webhookEventId, metadata = {}) {
    return PaymentWebhookEventModel.findByIdAndUpdate(
      webhookEventId,
      {
        status: "ignored",
        processedAt: new Date(),
        lastReceivedAt: new Date(),
        metadata,
      },
      {
        new: true,
        runValidators: true,
      },
    );
  },

  async markWebhookEventFailed(webhookEventId, processingError, metadata = {}) {
    return PaymentWebhookEventModel.findByIdAndUpdate(
      webhookEventId,
      {
        status: "failed",
        lastReceivedAt: new Date(),
        processingError: String(processingError || ""),
        metadata,
      },
      {
        new: true,
        runValidators: true,
      },
    );
  },
};
