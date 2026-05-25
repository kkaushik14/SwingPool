export const formatCurrency = (
  value: number,
  currency = "INR",
  options?: Intl.NumberFormatOptions
) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits:
      options?.minimumFractionDigits ?? (Number.isInteger(value) ? 0 : 2),
    maximumFractionDigits:
      options?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 2),
    ...options
  }).format(value);
};

export const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return "Not available";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return "Not available";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};
