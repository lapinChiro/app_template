import {
  formatDate,
  formatDateTime,
  parseDate,
  addDays,
  isPast,
  isFuture,
  diffInDays,
  formatDateJa,
} from '../date';

describe('date utilities', () => {
  // Fixed date for consistent testing
  const testDate = new Date('2024-01-15T12:30:45.123Z');
  
  beforeAll(() => {
    // Mock current date for isPast/isFuture tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-20T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      expect(formatDate(testDate)).toBe('2024-01-15');
    });

    it('should handle dates at year boundaries', () => {
      expect(formatDate(new Date('2023-12-31T23:59:59.999Z'))).toBe('2023-12-31');
      expect(formatDate(new Date('2024-01-01T00:00:00.000Z'))).toBe('2024-01-01');
    });
  });

  describe('formatDateTime', () => {
    it('should format date to ISO string', () => {
      expect(formatDateTime(testDate)).toBe('2024-01-15T12:30:45.123Z');
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain('2024-01-15');
    });

    it('should parse ISO date string', () => {
      const result = parseDate('2024-01-15T12:30:45.123Z');
      expect(result.toISOString()).toBe('2024-01-15T12:30:45.123Z');
    });

    it('should throw error for invalid date string', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date string');
      expect(() => parseDate('')).toThrow('Invalid date string');
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const result = addDays(testDate, 5);
      expect(formatDate(result)).toBe('2024-01-20');
    });

    it('should subtract negative days', () => {
      const result = addDays(testDate, -5);
      expect(formatDate(result)).toBe('2024-01-10');
    });

    it('should handle month boundaries', () => {
      const endOfMonth = new Date('2024-01-31');
      const result = addDays(endOfMonth, 1);
      expect(formatDate(result)).toBe('2024-02-01');
    });

    it('should handle year boundaries', () => {
      const endOfYear = new Date('2023-12-31');
      const result = addDays(endOfYear, 1);
      expect(formatDate(result)).toBe('2024-01-01');
    });
  });

  describe('isPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2024-01-10');
      expect(isPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2024-01-25');
      expect(isPast(futureDate)).toBe(false);
    });

    it('should return false for current moment', () => {
      const now = new Date('2024-01-20T00:00:00.000Z');
      expect(isPast(now)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date('2024-01-25');
      expect(isFuture(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2024-01-10');
      expect(isFuture(pastDate)).toBe(false);
    });

    it('should return false for current moment', () => {
      const now = new Date('2024-01-20T00:00:00.000Z');
      expect(isFuture(now)).toBe(false);
    });
  });

  describe('diffInDays', () => {
    it('should calculate difference between dates', () => {
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-15');
      expect(diffInDays(date1, date2)).toBe(5);
    });

    it('should return absolute difference', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-10');
      expect(diffInDays(date1, date2)).toBe(5);
    });

    it('should handle same dates', () => {
      expect(diffInDays(testDate, testDate)).toBe(0);
    });

    it('should handle dates across months', () => {
      const date1 = new Date('2024-01-31');
      const date2 = new Date('2024-02-05');
      expect(diffInDays(date1, date2)).toBe(5);
    });
  });

  describe('formatDateJa', () => {
    it('should format date in Japanese style', () => {
      expect(formatDateJa(testDate)).toBe('2024年01月15日');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-03-05');
      expect(formatDateJa(date)).toBe('2024年03月05日');
    });

    it('should handle different years', () => {
      const date = new Date('2025-12-31');
      expect(formatDateJa(date)).toBe('2025年12月31日');
    });
  });
});