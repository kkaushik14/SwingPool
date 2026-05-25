import { config } from "../config/index.js";
import { AppError } from "../errors/index.js";
import { createScopedLogger } from "../logger/index.js";
import { NOTIFICATION_CHANNELS } from "../components/notifications/notifications.enums.js";

const providerLogger = createScopedLogger("notification-providers");

const buildProviderResult = ({
  status,
  providerName,
  providerMessageId = null,
  errorMessage = "",
}) => ({
  status,
  providerName,
  providerMessageId,
  errorMessage,
});

const createLoggingProvider = (providerName, channel) => ({
  async send(payload, requestContext = {}) {
    providerLogger.info(
      {
        requestId: requestContext.requestId || null,
        channel,
        provider: providerName,
        recipient: payload.recipient,
        subject: payload.subject || "",
      },
      "Notification dispatched via logging provider",
    );

    return buildProviderResult({
      status: "sent",
      providerName,
      providerMessageId: `${channel}-${Date.now()}`,
    });
  },
});

const createNoopProvider = (providerName) => ({
  async send(_payload, _requestContext = {}) {
    return buildProviderResult({
      status: "skipped",
      providerName,
      providerMessageId: null,
      errorMessage: "Provider is configured as noop.",
    });
  },
});

const emailProviderRegistry = Object.freeze({
  log: createLoggingProvider("log", NOTIFICATION_CHANNELS.EMAIL),
  noop: createNoopProvider("noop"),
});

const smsProviderRegistry = Object.freeze({
  log: createLoggingProvider("log", NOTIFICATION_CHANNELS.SMS),
  noop: createNoopProvider("noop"),
});

const resolveProvider = (channel) => {
  if (channel === NOTIFICATION_CHANNELS.EMAIL) {
    const providerName = String(
      config.notifications.emailProvider || "noop",
    ).toLowerCase();
    return {
      providerName,
      provider:
        emailProviderRegistry[providerName] || emailProviderRegistry.noop,
    };
  }

  if (channel === NOTIFICATION_CHANNELS.SMS) {
    const providerName = String(config.notifications.smsProvider || "noop")
      .toLowerCase()
      .trim();
    return {
      providerName,
      provider: smsProviderRegistry[providerName] || smsProviderRegistry.noop,
    };
  }

  return {
    providerName: "in_app",
    provider: createNoopProvider("in_app"),
  };
};

export const notificationProviderService = {
  async send(payload, requestContext = {}) {
    const channel = payload.channel;

    if (!channel) {
      throw AppError.validation("Notification channel is required.");
    }

    const { providerName, provider } = resolveProvider(channel);

    try {
      const response = await provider.send(payload, requestContext);

      return {
        ...response,
        providerName,
      };
    } catch (error) {
      providerLogger.error(
        {
          requestId: requestContext.requestId || null,
          channel,
          provider: providerName,
          recipient: payload.recipient || null,
          error: error.message,
        },
        "Notification provider failed",
      );

      return buildProviderResult({
        status: "failed",
        providerName,
        errorMessage: error.message,
      });
    }
  },
};
