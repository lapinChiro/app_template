/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncate a string to specified length with ellipsis
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

/**
 * Convert string to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])([a-z])/g, '$1-$2$3')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

/**
 * Convert string to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c: string) => c.toLowerCase());
};

/**
 * Convert string to PascalCase
 */
export const toPascalCase = (str: string): string => {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

/**
 * Check if string is empty or contains only whitespace
 */
export const isBlank = (str: string): boolean => {
  return str.trim().length === 0;
};

/**
 * Remove extra whitespace and trim
 */
export const normalizeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};

/**
 * Generate a random string of specified length
 */
export const randomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Mask sensitive information (e.g., email, phone)
 */
export const mask = (str: string, visibleChars = 3): string => {
  if (str.length <= visibleChars * 2) {
    return '*'.repeat(str.length);
  }
  const start = str.slice(0, visibleChars);
  const end = str.slice(-visibleChars);
  const maskedLength = str.length - visibleChars * 2;
  const masked = '*'.repeat(maskedLength);
  return `${start}${masked}${end}`;
};

/**
 * Extract initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};