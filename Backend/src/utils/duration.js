export const parseDurationToMilliseconds = (rawDuration) => {
  const match = String(rawDuration).match(/^(\d+)([smhd])$/i);

  if (!match) {
    return 0;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit === "s") {
    return amount * 1000;
  }

  if (unit === "m") {
    return amount * 60 * 1000;
  }

  if (unit === "h") {
    return amount * 60 * 60 * 1000;
  }

  return amount * 24 * 60 * 60 * 1000;
};
