import type { ValidationFunction } from '../types/validation';

/**
 * Test data for validation functions
 */
export interface ValidationTestCase {
  input: string;
  expected: boolean;
  description?: string;
}

/**
 * Helper to run validation test cases
 */
export function runValidationTests(
  validator: ValidationFunction,
  validCases: string[],
  invalidCases: string[]
): void {
  describe('valid cases', () => {
    validCases.forEach((input) => {
      it(`should accept "${input}"`, () => {
        expect(validator(input)).toBe(true);
      });
    });
  });

  describe('invalid cases', () => {
    invalidCases.forEach((input) => {
      it(`should reject "${input}"`, () => {
        expect(validator(input)).toBe(false);
      });
    });
  });
}

/**
 * Helper for batch validation testing
 */
export function testValidationBatch(
  validator: ValidationFunction,
  testCases: ValidationTestCase[]
): void {
  testCases.forEach(({ input, expected, description }) => {
    const testDescription = description ?? `should ${expected ? 'accept' : 'reject'} "${input}"`;
    it(testDescription, () => {
      expect(validator(input)).toBe(expected);
    });
  });
}

/**
 * Common email test cases
 */
export const emailTestCases = {
  valid: [
    'test@example.com',
    'user.name@example.co.jp',
    'user+tag@example.com',
    'user_name@example-domain.com',
    'a@b.c',
    'test@192.168.1.1',
  ],
  invalid: [
    'invalid.email',
    '@example.com',
    'user@',
    'user @example.com',
    'user@example',
    '',
    'test@localhost',
  ],
};

/**
 * Common URL test cases
 */
export const urlTestCases = {
  valid: [
    'https://example.com',
    'http://example.com',
    'https://example.com/path',
    'https://example.com:8080',
    'https://sub.example.com',
    'https://example.com/path?query=value',
    'https://localhost',
    'https://192.168.1.1',
    'https://example.com:65535',
  ],
  invalid: [
    'example.com',
    'ftp://example.com',
    'https://',
    'https://example',
    '',
    'not a url',
  ],
};

/**
 * Japanese phone number test cases
 */
export const phoneTestCases = {
  valid: [
    '090-1234-5678',
    '080-1234-5678',
    '070-1234-5678',
    '03-1234-5678',
    '06-1234-5678',
    '09012345678',
    '0312345678',
  ],
  invalid: [
    '123-456-7890',
    '090-123-456',
    '1234567890',
    '',
    'phone number',
  ],
};

/**
 * Japanese postal code test cases
 */
export const postalCodeTestCases = {
  valid: [
    '123-4567',
    '1234567',
    '000-0000',
    '999-9999',
  ],
  invalid: [
    '12-3456',
    '123-456',
    '12345678',
    'abc-defg',
    '',
  ],
};

/**
 * Credit card test cases with known valid numbers
 */
export const creditCardTestCases = {
  valid: [
    { number: '4532015112830366', type: 'Visa' },
    { number: '5425233430109903', type: 'Mastercard' },
    { number: '374245455400126', type: 'Amex' },
    { number: '4532-0151-1283-0366', type: 'Visa with dashes' },
    { number: '4532 0151 1283 0366', type: 'Visa with spaces' },
  ],
  invalid: [
    '4532015112830367', // Invalid checksum
    '1234567890123456',
    '123',
    '',
    'not a card',
  ],
};