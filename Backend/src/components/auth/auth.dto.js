import { toUserDto } from "../users/users.dto.js";

export const toAuthTokenDto = (tokens) => ({
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  accessTokenExpiresIn: tokens.accessTokenExpiresIn,
  refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
});

export const toAuthResponseDto = ({ user, profile, tokens, verification }) => ({
  user: toUserDto(user, profile),
  tokens: toAuthTokenDto(tokens),
  verification: verification || null,
});
