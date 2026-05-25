const IST_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330;

const toDate = (value) => {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
};

const toISTShiftedDate = (value) => {
  const date = toDate(value);
  return new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
};

export const toISTDateTimeString = (value, locale = "en-IN") => {
  const date = toDate(value);

  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

export const startOfISTDay = (value) => {
  const istDate = toISTShiftedDate(value);

  const utcTimestamp =
    Date.UTC(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ) -
    IST_OFFSET_MINUTES * 60 * 1000;

  return new Date(utcTimestamp);
};

export const endOfISTDay = (value) => {
  const istDate = toISTShiftedDate(value);

  const utcTimestamp =
    Date.UTC(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate(),
      23,
      59,
      59,
      999,
    ) -
    IST_OFFSET_MINUTES * 60 * 1000;

  return new Date(utcTimestamp);
};

export const nowInIST = () => toISTDateTimeString(new Date());

export const IST = Object.freeze({
  timezone: IST_TIMEZONE,
  offsetMinutes: IST_OFFSET_MINUTES,
});
