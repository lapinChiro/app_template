/**
 * Format a Date object to YYYY-MM-DD string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? '';
};

/**
 * Format a Date object to ISO string with timezone
 */
export const formatDateTime = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse a date string to Date object with validation
 */
export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Check if a date is in the future
 */
export const isFuture = (date: Date): boolean => {
  return date > new Date();
};

/**
 * Get the difference in days between two dates
 */
export const diffInDays = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format a date to Japanese style (YYYY年MM月DD日)
 */
export const formatDateJa = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};