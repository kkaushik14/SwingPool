import mongoose from "mongoose";

export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};
