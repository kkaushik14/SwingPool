import { SORT_ORDER } from "../enums/index.js";

const orderMap = {
  asc: 1,
  desc: -1,
};

export const resolveSorting = ({ sortBy, sortOrder } = {}, options = {}) => {
  const {
    allowedFields = ["createdAt"],
    defaultSortBy = "createdAt",
    defaultSortOrder = SORT_ORDER.DESC,
  } = options;

  const normalizedSortBy = allowedFields.includes(sortBy)
    ? sortBy
    : defaultSortBy;
  const normalizedSortOrder =
    sortOrder === SORT_ORDER.ASC ? SORT_ORDER.ASC : defaultSortOrder;

  return {
    sortBy: normalizedSortBy,
    sortOrder: normalizedSortOrder,
    mongoSort: {
      [normalizedSortBy]: orderMap[normalizedSortOrder],
    },
  };
};
