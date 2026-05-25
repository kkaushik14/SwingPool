import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (plainTextPassword) => {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
};

export const comparePassword = async (plainTextPassword, passwordHash) => {
  return bcrypt.compare(plainTextPassword, passwordHash);
};
