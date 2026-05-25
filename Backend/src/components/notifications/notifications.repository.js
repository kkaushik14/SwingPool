import { NotificationModel } from "./notifications.model.js";
import { NotificationDeliveryModel } from "./notification-delivery.model.js";

export const notificationsRepository = {
  async create(payload) {
    return NotificationModel.create(payload);
  },

  async findById(id) {
    return NotificationModel.findById(id);
  },

  async findMany(filter = {}) {
    return NotificationModel.find(filter).sort({ createdAt: -1 });
  },
  async findByUserAndId(userId, id) {
    return NotificationModel.findOne({ _id: id, userId });
  },

  async listByUser(userId) {
    return NotificationModel.find({ userId }).sort({ createdAt: -1 });
  },

  async findByDedupeKey(dedupeKey) {
    return NotificationModel.findOne({ dedupeKey });
  },

  async updateById(id, updatePayload) {
    return NotificationModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async createDelivery(payload) {
    return NotificationDeliveryModel.create(payload);
  },

  async findDeliveryByDedupeKey(dedupeKey) {
    return NotificationDeliveryModel.findOne({ dedupeKey });
  },

  async updateDeliveryById(id, updatePayload) {
    return NotificationDeliveryModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async listDeliveriesByUser(userId) {
    return NotificationDeliveryModel.find({ userId }).sort({ createdAt: -1 });
  },
};
