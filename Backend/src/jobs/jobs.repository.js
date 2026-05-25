import { JobExecutionModel } from "./job-execution.model.js";

export const jobsRepository = {
  async findByJobAndRunKey(jobName, runKey) {
    return JobExecutionModel.findOne({ jobName, runKey });
  },

  async createExecution(payload) {
    return JobExecutionModel.create(payload);
  },

  async updateExecutionById(id, updatePayload) {
    return JobExecutionModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async listExecutions({ filter = {}, limit = 100 } = {}) {
    return JobExecutionModel.find(filter).sort({ startedAt: -1 }).limit(limit);
  },
};
