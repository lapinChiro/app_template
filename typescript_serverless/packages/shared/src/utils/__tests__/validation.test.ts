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
    it('should validate correct email formats', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@example.co.jp')).toBe(true);
      expect(isEmail('user+tag@example.com')).toBe(true);
      expect(isEmail('user_name@example-domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isEmail('invalid.email')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('user @example.com')).toBe(false);
      expect(isEmail('user@example')).toBe(false);
      expect(isEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isEmail('a@b.c')).toBe(true);
      expect(isEmail('test@localhost')).toBe(false);
      expect(isEmail('test@192.168.1.1')).toBe(true);
    });
  });

  describe('isURL', () => {
    it('should validate correct URL formats', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://example.com')).toBe(true);
      expect(isURL('https://example.com/path')).toBe(true);
      expect(isURL('https://example.com:8080')).toBe(true);
      expect(isURL('https://sub.example.com')).toBe(true);
      expect(isURL('https://example.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URL formats', () => {
      expect(isURL('example.com')).toBe(false);
      expect(isURL('ftp://example.com')).toBe(false);
      expect(isURL('https://')).toBe(false);
      expect(isURL('https://example')).toBe(false);
      expect(isURL('')).toBe(false);
      expect(isURL('not a url')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isURL('https://localhost')).toBe(true);
      expect(isURL('https://192.168.1.1')).toBe(true);
      expect(isURL('https://example.com:65535')).toBe(true);
    });
  });

  describe('isPhoneNumber', () => {
    it('should validate Japanese phone numbers', () => {
      expect(isPhoneNumber('090-1234-5678')).toBe(true);
      expect(isPhoneNumber('080-1234-5678')).toBe(true);
      expect(isPhoneNumber('070-1234-5678')).toBe(true);
      expect(isPhoneNumber('03-1234-5678')).toBe(true);
      expect(isPhoneNumber('06-1234-5678')).toBe(true);
      expect(isPhoneNumber('09012345678')).toBe(true);
      expect(isPhoneNumber('0312345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isPhoneNumber('123-456-7890')).toBe(false);
      expect(isPhoneNumber('090-123-456')).toBe(false);
      expect(isPhoneNumber('1234567890')).toBe(false);
      expect(isPhoneNumber('')).toBe(false);
      expect(isPhoneNumber('phone number')).toBe(false);
    });
  });

  describe('isPostalCode', () => {
    it('should validate Japanese postal codes', () => {
      expect(isPostalCode('123-4567')).toBe(true);
      expect(isPostalCode('1234567')).toBe(true);
      expect(isPostalCode('000-0000')).toBe(true);
      expect(isPostalCode('999-9999')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(isPostalCode('12-3456')).toBe(false);
      expect(isPostalCode('123-456')).toBe(false);
      expect(isPostalCode('12345678')).toBe(false);
      expect(isPostalCode('abc-defg')).toBe(false);
      expect(isPostalCode('')).toBe(false);
    });
  });

  describe('isCreditCard', () => {
    it('should validate credit card numbers using Luhn algorithm', () => {
      expect(isCreditCard('4532015112830366')).toBe(true); // Visa
      expect(isCreditCard('5425233430109903')).toBe(true); // Mastercard
      expect(isCreditCard('374245455400126')).toBe(true); // Amex
      expect(isCreditCard('4532-0151-1283-0366')).toBe(true); // With dashes
      expect(isCreditCard('4532 0151 1283 0366')).toBe(true); // With spaces
    });

    it('should reject invalid credit card numbers', () => {
      expect(isCreditCard('4532015112830367')).toBe(false); // Invalid checksum
      expect(isCreditCard('1234567890123456')).toBe(false);
      expect(isCreditCard('123')).toBe(false);
      expect(isCreditCard('')).toBe(false);
      expect(isCreditCard('not a card')).toBe(false);
    });
  });

  describe('isIPAddress', () => {
    it('should validate IPv4 addresses', () => {
      expect(isIPAddress('192.168.1.1')).toBe(true);
      expect(isIPAddress('10.0.0.0')).toBe(true);
      expect(isIPAddress('255.255.255.255')).toBe(true);
      expect(isIPAddress('0.0.0.0')).toBe(true);
    });

    it('should validate IPv6 addresses', () => {
      expect(isIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isIPAddress('2001:db8:85a3::8a2e:370:7334')).toBe(true);
      expect(isIPAddress('::')).toBe(true);
      expect(isIPAddress('::1')).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      expect(isIPAddress('256.1.1.1')).toBe(false);
      expect(isIPAddress('192.168.1')).toBe(false);
      expect(isIPAddress('192.168.1.1.1')).toBe(false);
      expect(isIPAddress('example.com')).toBe(false);
      expect(isIPAddress('')).toBe(false);
    });
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