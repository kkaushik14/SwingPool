const defaultTransformer = (value) => value;

const buildStringFilter = (value, allowRegex) => {
  if (!allowRegex) {
    return value;
  }

  return {
    $regex: String(value),
    $options: "i",
  };
};

export const buildMongoFilters = (query = {}, filterConfig = {}) => {
  const filters = {};

  for (const [queryKey, rawValue] of Object.entries(query)) {
    const config = filterConfig[queryKey];

    if (
      !config ||
      rawValue === undefined ||
      rawValue === null ||
      rawValue === ""
    ) {
      continue;
    }

    const {
      field = queryKey,
      operator = "$eq",
      allowRegex = false,
      transform = defaultTransformer,
    } = config;

    const value = transform(rawValue);

    if (operator === "$eq") {
      filters[field] = buildStringFilter(value, allowRegex);
      continue;
    }

    if (!filters[field] || typeof filters[field] !== "object") {
      filters[field] = {};
    }

    filters[field][operator] = value;
  }

  return filters;
};
