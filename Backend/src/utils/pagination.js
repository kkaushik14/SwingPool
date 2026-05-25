import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../constants/index.js";

export const resolvePagination = ({ page, pageSize } = {}) => {
  const normalizedPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const normalizedPageSize = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    skip: (normalizedPage - 1) * normalizedPageSize,
    limit: normalizedPageSize,
  };
};

export const buildPaginationMeta = ({ page, pageSize, totalItems }) => {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
};
