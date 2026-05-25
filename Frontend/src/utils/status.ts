import { statusToneMap } from "@/theme";

export const toStatusLabel = (value?: string | null) => {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const toStatusTone = (value?: string | null) => {
  if (!value) {
    return "muted";
  }

  return statusToneMap[value as keyof typeof statusToneMap] || "muted";
};
