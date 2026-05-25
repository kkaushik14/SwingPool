import type { UserRecord } from "./user";

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  persistedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  displayName: string;
}

export interface AuthResult {
  user: UserRecord;
  tokens: AuthTokenPair;
  verification?: {
    emailVerification?: {
      token: string;
      expiresAt?: string;
    };
  };
}
