import Decimal from "decimal.js";

Decimal.set({
  precision: 32,
  rounding: Decimal.ROUND_HALF_UP,
});

const toDecimal = (value) => new Decimal(value || 0);

export const addMoney = (...values) => {
  return values
    .reduce(
      (accumulator, value) => accumulator.plus(toDecimal(value)),
      toDecimal(0),
    )
    .toFixed(2);
};

export const subtractMoney = (left, right) => {
  return toDecimal(left).minus(toDecimal(right)).toFixed(2);
};

export const multiplyMoney = (value, multiplier) => {
  return toDecimal(value).times(toDecimal(multiplier)).toFixed(2);
};

export const divideMoney = (value, divisor) => {
  return toDecimal(value).dividedBy(toDecimal(divisor)).toFixed(2);
};

export const toMinorUnits = (value, fractionDigits = 2) => {
  return toDecimal(value)
    .times(new Decimal(10).pow(fractionDigits))
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
};

export const fromMinorUnits = (value, fractionDigits = 2) => {
  return toDecimal(value)
    .dividedBy(new Decimal(10).pow(fractionDigits))
    .toFixed(fractionDigits);
};

export const moneyEquals = (left, right) =>
  toDecimal(left).equals(toDecimal(right));
