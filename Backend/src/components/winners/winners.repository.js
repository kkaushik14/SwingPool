import { WinnerModel } from "./winners.model.js";
import { WinnerProofSubmissionModel } from "./winner-proof-submission.model.js";

export const winnersRepository = {
  async create(payload) {
    return WinnerModel.create(payload);
  },

  async createMany(payload) {
    return WinnerModel.insertMany(payload, { ordered: true });
  },

  async findById(id) {
    return WinnerModel.findById(id);
  },

  async findByUserAndId(userId, id) {
    return WinnerModel.findOne({ _id: id, userId });
  },

  async findMany(filter = {}) {
    return WinnerModel.find(filter).sort({ createdAt: -1 });
  },

  async listByUserId(userId) {
    return WinnerModel.find({ userId }).sort({ createdAt: -1 });
  },

  async findProofDeadlineExceededCandidates(runAt = new Date()) {
    return WinnerModel.find({
      payoutStatus: {
        $in: ["pending_verification", "rejected"],
      },
      verificationDeadlineAt: {
        $lt: runAt,
      },
    }).sort({ verificationDeadlineAt: 1 });
  },

  async updateById(id, updatePayload) {
    return WinnerModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async createProofSubmission(payload) {
    return WinnerProofSubmissionModel.create(payload);
  },

  async findProofSubmissionById(id) {
    return WinnerProofSubmissionModel.findById(id);
  },

  async findLatestProofSubmissionForWinner(winnerId) {
    return WinnerProofSubmissionModel.findOne({ winnerId }).sort({
      submissionNumber: -1,
      createdAt: -1,
    });
  },

  async listProofSubmissionsForWinner(winnerId) {
    return WinnerProofSubmissionModel.find({ winnerId }).sort({
      submissionNumber: -1,
      createdAt: -1,
    });
  },

  async updateProofSubmissionById(id, updatePayload) {
    return WinnerProofSubmissionModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },
};
