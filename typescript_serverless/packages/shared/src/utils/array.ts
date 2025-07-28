/**
 * Remove duplicate values from an array
 */
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Remove duplicate objects by a key
 */
export const uniqueBy = <T, K extends keyof T>(
  array: T[],
  key: K
): T[] => {
  const seen = new Set<T[K]>();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Group array items by a key
 */
export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    groups[groupKey] ??= [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Chunk array into smaller arrays
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Shuffle array randomly
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // We know these indices are valid because j <= i < array.length
    const temp = shuffled[i] as T;
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp;
  }
  return shuffled;
};

/**
 * Get last element of array
 */
export const last = <T>(array: T[]): T | undefined => {
  return array[array.length - 1];
};

/**
 * Get first element of array
 */
export const first = <T>(array: T[]): T | undefined => {
  return array[0];
};

/**
 * Create array of specified length with values
 */
export const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Safe array access with default value
 */
export const at = <T>(array: T[], index: number, defaultValue?: T): T | undefined => {
  if (index < 0) {
    index = array.length + index;
  }
  return array[index] ?? defaultValue;
};

/**
 * Count occurrences in array
 */
export const countBy = <T>(array: T[], fn: (item: T) => string): Record<string, number> => {
  return array.reduce((counts, item) => {
    const key = fn(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);
};