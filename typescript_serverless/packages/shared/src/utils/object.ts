/**
 * Check if value is a plain object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof Promise) &&
    !(value instanceof Set) &&
    !(value instanceof Map) &&
    typeof value !== 'function'
  );
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    // We need to cast here because TypeScript can't infer the array element types
    const clonedArray: unknown[] = [];
    for (const item of obj) {
      clonedArray.push(deepClone(item));
    }
    return clonedArray as T;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Partial<T>>
): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];
        
        if (isObject(sourceValue) && isObject(targetValue)) {
          target[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          ) as T[Extract<keyof T, string>];
        } else {
          target[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
  }

  return deepMerge(target, ...sources);
};

/**
 * Pick specific keys from object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Get nested property value safely
 */
export const get = <T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T
): T | undefined => {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result === undefined ? defaultValue : (result as T);
};

/**
 * Set nested property value
 */
export const set = <T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  if (!lastKey) return obj;

  let current: Record<string, unknown> = obj;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
  return obj;
};

/**
 * Convert object to query string
 */
export const toQueryString = (params: Record<string, unknown>): string => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};

/**
 * Parse query string to object
 */
export const fromQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};