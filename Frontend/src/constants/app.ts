export const APP_META = {
  name: import.meta.env.VITE_APP_NAME || "Swing Pool",
  tagline: "Golf performance, charitable impact, and monthly reward moments in one warm digital home.",
  description:
    "Swing Pool helps subscribers complete profile verification, track their latest scores, support charities, and stay in sync with subscription and draw milestones without relying on cold sports-dashboard tropes."
} as const;

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1"
} as const;

export const STORAGE_KEYS = {
  theme: "swing-pool.theme",
  session: "swing-pool.session"
} as const;
