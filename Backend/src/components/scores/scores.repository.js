import { ScoreModel } from "./scores.model.js";
import { SCORES_STATUSES } from "./scores.enums.js";

export const scoresRepository = {
  async create(payload) {
    return ScoreModel.create(payload);
  },

  async findById(id) {
    return ScoreModel.findById(id);
  },

  async findMany(filter = {}) {
    return ScoreModel.find(filter).sort({ createdAt: -1 });
  },

  async findByUserAndId(userId, id) {
    return ScoreModel.findOne({ _id: id, userId });
  },

  async listByUserPaginated(
    userId,
    {
      filter = {},
      skip = 0,
      limit = 20,
      sort = { submittedAt: -1, createdAt: -1 },
    } = {},
  ) {
    return ScoreModel.find({ userId, ...filter })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  async countByUser(userId, { filter = {} } = {}) {
    return ScoreModel.countDocuments({ userId, ...filter });
  },

  async listQualifyingByUser(
    userId,
    { excludeScoreId = null, limit = null } = {},
  ) {
    const query = {
      userId,
      status: SCORES_STATUSES.ACTIVE,
      isBackdated: false,
    };

    if (excludeScoreId) {
      query._id = {
        $ne: excludeScoreId,
      };
    }

    const cursor = ScoreModel.find(query).sort({
      submittedAt: -1,
      createdAt: -1,
    });

    if (Number.isInteger(limit) && limit > 0) {
      return cursor.limit(limit);
    }

    return cursor;
  },

  async countQualifyingByUser(userId) {
    return ScoreModel.countDocuments({
      userId,
      status: SCORES_STATUSES.ACTIVE,
      isBackdated: false,
    });
  },

  async updateById(id, updatePayload) {
    return ScoreModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },
};
