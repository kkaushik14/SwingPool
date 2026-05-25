export interface OverviewReport {
  summary?: Record<string, number | string>;
  users?: Record<string, number>;
  subscriptions?: Record<string, number>;
  payments?: Record<string, number>;
  charities?: Record<string, number>;
  draws?: Record<string, number>;
  winners?: Record<string, number>;
}
