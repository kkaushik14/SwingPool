const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const mergeConfig = (base, override) => {
  if (!isPlainObject(base)) {
    return structuredClone(override);
  }

  if (!isPlainObject(override)) {
    return structuredClone(base);
  }

  const output = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = mergeConfig(output[key], value);
      continue;
    }

    output[key] = Array.isArray(value) ? [...value] : value;
  }

  return output;
};

export const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);

    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }

  return value;
};
