import { PROFILE_COMPLETION_STATUSES } from "../../enums/index.js";

import { UserModel } from "./users.model.js";
import { UserProfileModel } from "./users-profile.model.js";

const REQUIRED_PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "dateOfBirth",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
];

const resolveProfileCompletionStatus = (profilePayload) => {
  const isComplete = REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = profilePayload[field];

    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }

    return typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
  });

  return isComplete
    ? PROFILE_COMPLETION_STATUSES.COMPLETED
    : PROFILE_COMPLETION_STATUSES.INCOMPLETE;
};

export const usersRepository = {
  async create(payload) {
    return UserModel.create(payload);
  },

  async findByEmail(email) {
    return UserModel.findOne({ email: email.toLowerCase() });
  },

  async findById(id) {
    return UserModel.findById(id);
  },

  async findByIds(ids) {
    return UserModel.find({ _id: { $in: ids } });
  },

  async list(filters = {}) {
    return UserModel.find(filters).sort({ createdAt: -1 });
  },

  async updateById(id, updatePayload) {
    return UserModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async createProfile(payload) {
    const completionStatus = resolveProfileCompletionStatus(payload);

    return UserProfileModel.create({
      ...payload,
      completionStatus,
    });
  },

  async findProfileByUserId(userId) {
    return UserProfileModel.findOne({ userId });
  },

  async upsertProfileByUserId(userId, updatePayload = {}) {
    const existingProfile = await UserProfileModel.findOne({ userId });
    const mergedPayload = {
      ...(existingProfile?.toObject
        ? existingProfile.toObject()
        : existingProfile || {}),
      ...updatePayload,
      userId,
    };

    const completionStatus = resolveProfileCompletionStatus(mergedPayload);

    return UserProfileModel.findOneAndUpdate(
      { userId },
      {
        ...updatePayload,
        completionStatus,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  },

  async updateProfileByUserId(userId, updatePayload) {
    return UserProfileModel.findOneAndUpdate({ userId }, updatePayload, {
      new: true,
      runValidators: true,
    });
  },
};

export const usersProfileRules = {
  REQUIRED_PROFILE_FIELDS,
  resolveProfileCompletionStatus,
};
