import {
  runValidationTests,
  testValidationBatch,
  emailTestCases,
  urlTestCases,
  phoneTestCases,
  postalCodeTestCases,
  creditCardTestCases,
} from '../../test-utils/validation-helpers';
import type { ValidationTestCase } from '../../test-utils/validation-helpers';
import {
  isEmail,
  isURL,
  isPhoneNumber,
  isPostalCode,
  isCreditCard,
  isIPAddress,
  isHexColor,
  isAlphanumeric,
  minLength,
  maxLength,
  inRange,
} from '../validation';

describe('validation utilities', () => {
  describe('isEmail', () => {
    runValidationTests(isEmail, emailTestCases.valid, emailTestCases.invalid);
  });

  describe('isURL', () => {
    runValidationTests(isURL, urlTestCases.valid, urlTestCases.invalid);
  });

  describe('isPhoneNumber', () => {
    runValidationTests(isPhoneNumber, phoneTestCases.valid, phoneTestCases.invalid);
  });

  describe('isPostalCode', () => {
    runValidationTests(isPostalCode, postalCodeTestCases.valid, postalCodeTestCases.invalid);
  });

  describe('isCreditCard', () => {
    describe('valid credit card numbers (Luhn algorithm)', () => {
      creditCardTestCases.valid.forEach(({ number, type }) => {
        it(`should accept ${type}: ${number}`, () => {
          expect(isCreditCard(number)).toBe(true);
        });
      });
    });

    describe('invalid credit card numbers', () => {
      creditCardTestCases.invalid.forEach((number) => {
        it(`should reject "${number}"`, () => {
          expect(isCreditCard(number)).toBe(false);
        });
      });
    });
  });

  describe('isIPAddress', () => {
    const ipTestCases: ValidationTestCase[] = [
      // IPv4 valid
      { input: '192.168.1.1', expected: true, description: 'should validate standard IPv4' },
      { input: '10.0.0.0', expected: true, description: 'should validate private IPv4' },
      { input: '255.255.255.255', expected: true, description: 'should validate max IPv4' },
      { input: '0.0.0.0', expected: true, description: 'should validate zero IPv4' },
      // IPv6 valid
      { input: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', expected: true, description: 'should validate full IPv6' },
      { input: '2001:db8:85a3::8a2e:370:7334', expected: true, description: 'should validate compressed IPv6' },
      { input: '::', expected: true, description: 'should validate IPv6 zero address' },
      { input: '::1', expected: true, description: 'should validate IPv6 loopback' },
      // Invalid
      { input: '256.1.1.1', expected: false, description: 'should reject out-of-range IPv4' },
      { input: '192.168.1', expected: false, description: 'should reject incomplete IPv4' },
      { input: '192.168.1.1.1', expected: false, description: 'should reject too many octets' },
      { input: 'example.com', expected: false, description: 'should reject domain names' },
      { input: '', expected: false, description: 'should reject empty string' },
    ];

    testValidationBatch(isIPAddress, ipTestCases);
  });

  describe('isHexColor', () => {
    it('should validate hex color codes', () => {
      expect(isHexColor('#000000')).toBe(true);
      expect(isHexColor('#FFFFFF')).toBe(true);
      expect(isHexColor('#abc123')).toBe(true);
      expect(isHexColor('#ABC')).toBe(true);
      expect(isHexColor('#123')).toBe(true);
    });

    it('should reject invalid hex color codes', () => {
      expect(isHexColor('000000')).toBe(false);
      expect(isHexColor('#GGGGGG')).toBe(false);
      expect(isHexColor('#12')).toBe(false);
      expect(isHexColor('#1234567')).toBe(false);
      expect(isHexColor('')).toBe(false);
    });
  });

  describe('isAlphanumeric', () => {
    it('should validate alphanumeric strings', () => {
      expect(isAlphanumeric('abc123')).toBe(true);
      expect(isAlphanumeric('ABC123')).toBe(true);
      expect(isAlphanumeric('test')).toBe(true);
      expect(isAlphanumeric('123')).toBe(true);
    });

    it('should reject non-alphanumeric strings', () => {
      expect(isAlphanumeric('abc-123')).toBe(false);
      expect(isAlphanumeric('abc 123')).toBe(false);
      expect(isAlphanumeric('abc_123')).toBe(false);
      expect(isAlphanumeric('abc@123')).toBe(false);
      expect(isAlphanumeric('')).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should validate minimum string length', () => {
      expect(minLength('hello', 3)).toBe(true);
      expect(minLength('hello', 5)).toBe(true);
      expect(minLength('hello world', 5)).toBe(true);
    });

    it('should reject strings shorter than minimum', () => {
      expect(minLength('hi', 3)).toBe(false);
      expect(minLength('', 1)).toBe(false);
      expect(minLength('test', 5)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(minLength('', 0)).toBe(true);
      expect(minLength('a', 1)).toBe(true);
    });
  });

  describe('maxLength', () => {
    it('should validate maximum string length', () => {
      expect(maxLength('hello', 10)).toBe(true);
      expect(maxLength('hello', 5)).toBe(true);
      expect(maxLength('', 5)).toBe(true);
    });

    it('should reject strings longer than maximum', () => {
      expect(maxLength('hello world', 5)).toBe(false);
      expect(maxLength('test', 3)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(maxLength('', 0)).toBe(true);
      expect(maxLength('a', 1)).toBe(true);
    });
  });

  describe('inRange', () => {
    it('should validate numbers within range', () => {
      expect(inRange(5, 1, 10)).toBe(true);
      expect(inRange(1, 1, 10)).toBe(true);
      expect(inRange(10, 1, 10)).toBe(true);
      expect(inRange(0, -5, 5)).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(inRange(0, 1, 10)).toBe(false);
      expect(inRange(11, 1, 10)).toBe(false);
      expect(inRange(-1, 0, 10)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(inRange(0, 0, 0)).toBe(true);
      expect(inRange(-5, -10, -1)).toBe(true);
    });
  });
});